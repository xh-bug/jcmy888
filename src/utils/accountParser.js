// 账号解析纯逻辑：不依赖 DOM，由 Vue 组件持有响应式状态并调用
import * as XLSX from 'xlsx'

export { XLSX }

export const FIELDS = [
  { key: 'deviceId', label: '手机编号', manual: true },
  { key: 'ip', label: 'IP', manual: true },
  { key: 'account', label: '账号' },
  { key: 'password', label: '密码', secret: true },
  { key: 'email', label: '邮箱账号' },
  { key: 'emailPassword', label: '邮箱密码', secret: true },
  { key: 'decodeUrl', label: '邮箱解码链接', url: true },
  { key: 'region', label: '地区' },
]

export const MANUAL_COUNT = 2

export const SAMPLE = 'geovauyge97----Tt83#Njr925----GeovannyBergstromrdi@outlook.com----bsikjqcsr336----[https://tk.jiuhangapi.top/m#GeovannyBergstromrdi@outlook.com/CpHEei3lFvP9i91fJAELhyVfouw1vV1v----](https://tk.jiuhangapi.top/m#GeovannyBergstromrdi@outlook.com/CpHEei3lFvP9i91fJAELhyVfouw1vV1v----)墨西哥'

export const STORE_KEY = 'account-parser.records.v1'
export const DEDUP_STORE_KEY = 'account-parser.dedup.v1'

const TOKEN_RE = /\u0001L(\d+)\u0001/
const SEP_RE = /-{3,}/

export const DEDUP_MODES = [
  { id: 'default', label: '账号 + 邮箱账号 + 链接（默认）', keys: ['account', 'email', 'decodeUrl'] },
  { id: 'account', label: '仅账号', keys: ['account'] },
  { id: 'email', label: '仅邮箱账号', keys: ['email'] },
  { id: 'accountPwd', label: '账号 + 密码', keys: ['account', 'password'] },
  { id: 'all', label: '全部八个字段', keys: FIELDS.map((f) => f.key) },
  { id: 'raw', label: '整行原始内容', keys: [] },
]

export function findMode(id) {
  return DEDUP_MODES.find((m) => m.id === id) || DEDUP_MODES[0]
}

export function cleanUrl(u) {
  return String(u == null ? '' : u)
    .trim()
    .replace(/[\s\u0000-\u001f]+$/g, '')
    .replace(/-{2,}$/g, '')
    .replace(/[)\],;]+$/g, '')
    .trim()
}

function looksLikeRegion(s) {
  if (!s) return false
  const t = String(s).trim()
  if (/^[\u4e00-\u9fa5·・\s]{1,12}$/.test(t)) return true
  if (/^[A-Za-z][A-Za-z\s\-]{1,24}$/.test(t) && !/\d/.test(t)) return true
  return false
}

export function parseLine(raw) {
  const original = String(raw == null ? '' : raw).trim()
  if (!original) return null

  const warnings = []
  const links = []
  let s = original.replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_, label, url) => {
    const i = links.push(cleanUrl(url)) - 1
    return '\u0001L' + i + '\u0001'
  })

  let parts = s.split(SEP_RE).map((x) => x.trim())
  while (parts.length && parts[0] === '') parts.shift()
  while (parts.length && parts[parts.length - 1] === '') parts.pop()

  let linkIndex = -1
  let trailingRegion = ''
  for (let i = 0; i < parts.length; i++) {
    const m = TOKEN_RE.exec(parts[i])
    if (m) {
      linkIndex = i
      const before = parts[i].slice(0, m.index).trim()
      const after = parts[i].slice(m.index + m[0].length).trim().replace(/^-+/, '').trim()
      if (before) warnings.push('链接前存在多余文本，已忽略：' + before)
      trailingRegion = after
      parts[i] = links[Number(m[1])]
      break
    }
  }
  if (linkIndex >= 0 && trailingRegion) {
    parts.splice(linkIndex + 1, 0, trailingRegion)
  }

  if (linkIndex < 0) {
    let start = -1
    for (let j = 0; j < parts.length; j++) {
      if (/^https?:\/\//i.test(parts[j])) { start = j; break }
    }
    if (start >= 0 && parts.length - 1 > start) {
      const last = parts[parts.length - 1]
      const regionLike = looksLikeRegion(last)
      const end = regionLike ? parts.length - 1 : parts.length
      const merged = parts.slice(start, end).join('----')
      const rebuilt = parts.slice(0, start).concat([cleanUrl(merged)])
      if (regionLike) rebuilt.push(last)
      parts = rebuilt
      if (end - start > 1) warnings.push('链接内部含分隔符，已自动合并')
    }
  }

  parts = parts.map((p, idx) => {
    const v = String(p == null ? '' : p).trim()
    return idx === 4 ? cleanUrl(v) : v.replace(/-{2,}$/g, '').trim()
  })

  const values = {}
  FIELDS.forEach((f, idx) => {
    if (f.manual) { values[f.key] = ''; return }
    const v = parts[idx - MANUAL_COUNT]
    values[f.key] = v === undefined ? '' : v
  })

  if (parts.length < 5) warnings.push('字段不足：仅识别到 ' + parts.length + ' 段')
  if (!values.account) warnings.push('账号为空')
  if (!values.decodeUrl) warnings.push('邮箱解码链接为空')
  if (!values.region) warnings.push('地区为空')
  if (parts.length > 6) warnings.push('共识别到 ' + parts.length + ' 段，第 7 段及之后已忽略')

  return {
    values,
    warnings,
    extra: parts.slice(6),
    raw: original,
    ok: warnings.length === 0,
  }
}

export function parseAll(text) {
  return String(text == null ? '' : text)
    .split(/\r?\n/)
    .map(parseLine)
    .filter(Boolean)
}

export const storageAvailable = (function () {
  try {
    if (typeof localStorage === 'undefined') return false
    localStorage.setItem('__account_parser_probe__', '1')
    localStorage.removeItem('__account_parser_probe__')
    return true
  } catch (e) {
    return false
  }
})()

export function loadDedupMode() {
  if (!storageAvailable) return 'default'
  try {
    const v = localStorage.getItem(DEDUP_STORE_KEY)
    return DEDUP_MODES.some((m) => m.id === v) ? v : 'default'
  } catch (e) {
    return 'default'
  }
}

export function saveDedupMode(id) {
  if (!storageAvailable) return
  try { localStorage.setItem(DEDUP_STORE_KEY, id) } catch (e) { /* ignore */ }
}

export function dedupKey(rec, modeId) {
  const mode = findMode(modeId)
  const v = (rec && rec.values) || {}
  if (mode.id === 'raw') return 'RAW:' + (rec.raw || '')
  const joined = mode.keys.map((k) => v[k] || '').join('\u0000')
  return /\S/.test(joined.replace(/\u0000/g, '')) ? joined : 'RAW:' + (rec.raw || '')
}

export function scanDuplicates(records, modeId) {
  const counts = {}
  const keys = []
  const firsts = []
  records.forEach((rec) => {
    const key = dedupKey(rec, modeId)
    if (counts[key] === undefined) { counts[key] = 0; keys.push(key) }
    counts[key]++
    firsts.push(counts[key] === 1)
  })
  const flags = firsts.map((isFirst, idx) => {
    const key = dedupKey(records[idx], modeId)
    return { dup: !isFirst, inGroup: counts[key] > 1, keeper: isFirst }
  })
  return {
    flags,
    groups: keys.filter((k) => counts[k] > 1).length,
    dupCount: flags.filter((f) => f.dup).length,
  }
}

export function removeDuplicates(records, modeId) {
  const scan = scanDuplicates(records, modeId)
  const kept = records.filter((_, i) => !scan.flags[i].dup)
  return { kept, removed: records.length - kept.length }
}

export function loadRecords() {
  if (!storageAvailable) return []
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.filter((r) => r && r.values).map((r) => {
      const values = {}
      FIELDS.forEach((f) => {
        values[f.key] = r.values[f.key] == null ? '' : String(r.values[f.key])
      })
      return {
        values,
        warnings: Array.isArray(r.warnings) ? r.warnings : [],
        extra: Array.isArray(r.extra) ? r.extra : [],
        raw: String(r.raw || ''),
        addedAt: String(r.addedAt || ''),
        ok: !!r.ok,
      }
    })
  } catch (e) {
    return []
  }
}

export function saveRecords(records) {
  if (!storageAvailable) return false
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(records))
    return true
  } catch (e) {
    return false
  }
}

export function appendRecords(records, parsed, manual) {
  const seen = {}
  records.forEach((r) => { seen[dedupKey(r)] = true })
  let added = 0
  let dup = 0
  parsed.forEach((r) => {
    const key = dedupKey(r)
    if (seen[key]) { dup++; return }
    seen[key] = true
    r.addedAt = new Date().toISOString()
    if (manual) {
      FIELDS.forEach((f) => {
        if (f.manual && manual[f.key] != null) {
          r.values[f.key] = String(manual[f.key]).trim()
        }
      })
    }
    records.push(r)
    added++
  })
  return { added, dup, total: records.length }
}

export function fmtTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const p = (n) => String(n).padStart(2, '0')
  return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
}

const ALIAS = {
  '手机编号': 'deviceId', '设备编号': 'deviceId', '手机': 'deviceId',
  'ip': 'ip', 'ip地址': 'ip',
  '账号': 'account', '密码': 'password',
  '邮箱账号': 'email', '邮箱': 'email',
  '邮箱密码': 'emailPassword',
  '邮箱解码链接': 'decodeUrl', '解码链接': 'decodeUrl', '链接': 'decodeUrl',
  '地区': 'region',
}
const HEADER_MAP = (function () {
  const m = {}
  FIELDS.forEach((f) => {
    m[f.label.toLowerCase()] = f.key
    m[f.key.toLowerCase()] = f.key
  })
  Object.keys(ALIAS).forEach((k) => { m[k] = ALIAS[k] })
  return m
})()

export function splitDelimited(text) {
  const src = String(text == null ? '' : text).replace(/^\ufeff/, '')
  if (!src.trim()) return { rows: [], delim: ',', blank: 0 }
  const firstLine = src.split(/\r?\n/)[0] || ''
  const delim = (firstLine.split('\t').length - 1) > (firstLine.split(',').length - 1) ? '\t' : ','
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else {
        field += ch
      }
    } else if (ch === '"' && field === '') {
      inQuotes = true
    } else if (ch === delim) {
      row.push(field); field = ''
    } else if (ch === '\n') {
      row.push(field); rows.push(row); row = []; field = ''
    } else if (ch !== '\r') {
      field += ch
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  const all = rows
  const filtered = all.filter((r) => r.some((c) => String(c).trim() !== ''))
  return { rows: filtered, delim, blank: all.length - filtered.length }
}

export function parseImport(text) {
  const parsed = splitDelimited(text)
  const rows = parsed.rows
  let skipped = parsed.blank || 0
  if (!rows.length) return { records: [], headerFound: false, skipped }

  let headerMap = null
  let start = 0
  const tmp = {}
  let hits = 0
  rows[0].forEach((cell, idx) => {
    const key = HEADER_MAP[String(cell).replace(/^\ufeff/, '').trim().toLowerCase()]
    if (key && tmp[key] === undefined) { tmp[key] = idx; hits++ }
  })
  if (hits >= 2) { headerMap = tmp; start = 1 }

  const legacyOrder = ['account', 'password', 'email', 'emailPassword', 'decodeUrl', 'region']
  const modernOrder = FIELDS.map((f) => f.key)
  const out = []

  for (let i = start; i < rows.length; i++) {
    const cells = rows[i]
    const values = {}
    FIELDS.forEach((f) => { values[f.key] = '' })

    if (headerMap) {
      FIELDS.forEach((f) => {
        const idx = headerMap[f.key]
        if (idx !== undefined && cells[idx] !== undefined) {
          values[f.key] = String(cells[idx]).trim()
        }
      })
    } else {
      const order = cells.length <= 6 ? legacyOrder : modernOrder
      order.forEach((k, idx) => {
        if (cells[idx] !== undefined) values[k] = String(cells[idx]).trim()
      })
    }

    if (!FIELDS.some((f) => values[f.key])) { skipped++; continue }

    const warnings = []
    if (!values.account) warnings.push('账号为空')
    if (!values.decodeUrl) warnings.push('邮箱解码链接为空')
    if (!values.region) warnings.push('地区为空')
    if (!headerMap && cells.length < 6) warnings.push('列数不足：仅 ' + cells.length + ' 列')

    out.push({
      values,
      warnings,
      extra: [],
      raw: cells.join(parsed.delim),
      ok: warnings.length === 0,
    })
  }
  return { records: out, headerFound: !!headerMap, skipped }
}

export function importText(records, text) {
  const result = parseImport(text)
  if (!result.records.length) {
    return { added: 0, dup: 0, total: records.length, skipped: result.skipped, headerFound: result.headerFound, empty: true }
  }
  const res = appendRecords(records, result.records)
  return { added: res.added, dup: res.dup, total: res.total, skipped: result.skipped, headerFound: result.headerFound, empty: false }
}

export function toTSV(records) {
  const lines = [FIELDS.map((f) => f.label).join('\t')]
  records.forEach((r) => lines.push(FIELDS.map((f) => r.values[f.key]).join('\t')))
  return lines.join('\n')
}

export function toCSV(records) {
  const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'
  const lines = [FIELDS.map((f) => esc(f.label)).join(',')]
  records.forEach((r) => lines.push(FIELDS.map((f) => esc(r.values[f.key])).join(',')))
  return '\ufeff' + lines.join('\r\n')
}

// 导出时把 IP 放在第一列、手机编号第二列；相同 IP 的记录排在一起，IP 只在每组首行写一次，后续行留空
export function toCSVMergedIP(records) {
  const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'
  const exportKeys = [
    'ip', 'deviceId', 'account', 'password', 'email', 'emailPassword', 'decodeUrl', 'region',
  ]
  const exportFields = exportKeys.map((key) => FIELDS.find((f) => f.key === key))

  const groups = new Map()
  records.forEach((r) => {
    const ip = r.values.ip || ''
    if (!groups.has(ip)) groups.set(ip, [])
    groups.get(ip).push(r)
  })

  const lines = [exportFields.map((f) => esc(f.label)).join(',')]
  groups.forEach((group) => {
    group.forEach((r, idx) => {
      const values = exportFields.map((f) => {
        const v = f.key === 'ip' && idx > 0 ? '' : r.values[f.key]
        return esc(v)
      })
      lines.push(values.join(','))
    })
  })
  return '\ufeff' + lines.join('\r\n')
}

// 导出 xlsx：IP 在第一列，相同 IP 合并单元格，手机编号第二列
export function toXlsxMergedIP(records) {
  const exportKeys = ['ip', 'deviceId', 'account', 'password', 'email', 'emailPassword', 'decodeUrl', 'region']
  const labels = exportKeys.map((key) => FIELDS.find((f) => f.key === key).label)

  const groups = new Map()
  records.forEach((r) => {
    const ip = r.values.ip || ''
    if (!groups.has(ip)) groups.set(ip, [])
    groups.get(ip).push(r)
  })

  const aoa = [labels]
  const merges = []
  let rowIndex = 1

  groups.forEach((group) => {
    group.forEach((r, idx) => {
      aoa.push(exportKeys.map((key) => (key === 'ip' && idx > 0 ? null : (r.values[key] || ''))))
    })
    if (group.length > 1) {
      merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex + group.length - 1, c: 0 } })
    }
    rowIndex += group.length
  })

  const sheet = XLSX.utils.aoa_to_sheet(aoa)
  sheet['!merges'] = merges
  sheet['!cols'] = [
    { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 18 },
    { wch: 34 }, { wch: 20 }, { wch: 50 }, { wch: 14 },
  ]
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, '账号数据')
  return XLSX.write(book, { bookType: 'xlsx', type: 'array' })
}

// 解析 xlsx：把工作表按表头名映射为记录，兼容合并的 IP 单元格（向下填充）
export function parseXlsx(buffer) {
  let book
  try {
    book = XLSX.read(buffer, { type: 'array' })
  } catch (e) {
    return { records: [], headerFound: false, skipped: 0, error: true }
  }
  const name = book.SheetNames[0]
  if (!name) return { records: [], headerFound: false, skipped: 0, error: true }
  const sheet = book.Sheets[name]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })

  // 合并单元格只在中左上角有值，把 IP（第 0 列）的值向下填充到合并范围内
  const merges = sheet['!merges'] || []
  merges.forEach((m) => {
    if (m.s.c === 0 && m.e.c === 0) {
      const val = rows[m.s.r] && rows[m.s.r][0]
      for (let r = m.s.r + 1; r <= m.e.r; r++) {
        if (!rows[r]) rows[r] = []
        rows[r][0] = val
      }
    }
  })

  // 用表头名映射列（兼容导出的 IP 在前 / 手机编号在后的顺序）
  let headerMap = null
  let start = 0
  const tmp = {}
  let hits = 0
  if (rows.length) {
    rows[0].forEach((cell, idx) => {
      const key = HEADER_MAP[String(cell == null ? '' : cell).trim().toLowerCase()]
      if (key && tmp[key] === undefined) { tmp[key] = idx; hits++ }
    })
  }
  if (hits >= 2) { headerMap = tmp; start = 1 }

  const legacyOrder = ['account', 'password', 'email', 'emailPassword', 'decodeUrl', 'region']
  const modernOrder = FIELDS.map((f) => f.key)
  const out = []
  let skipped = 0

  for (let i = start; i < rows.length; i++) {
    const cells = rows[i] || []
    const values = {}
    FIELDS.forEach((f) => { values[f.key] = '' })
    if (headerMap) {
      FIELDS.forEach((f) => {
        const idx = headerMap[f.key]
        if (idx !== undefined && cells[idx] !== undefined) {
          values[f.key] = String(cells[idx] == null ? '' : cells[idx]).trim()
        }
      })
    } else {
      const order = cells.length <= 6 ? legacyOrder : modernOrder
      order.forEach((k, idx) => {
        if (cells[idx] !== undefined) values[k] = String(cells[idx] == null ? '' : cells[idx]).trim()
      })
    }
    if (!FIELDS.some((f) => values[f.key])) { skipped++; continue }
    const warnings = []
    if (!values.account) warnings.push('账号为空')
    if (!values.decodeUrl) warnings.push('邮箱解码链接为空')
    if (!values.region) warnings.push('地区为空')
    if (!headerMap && cells.length < 6) warnings.push('列数不足：仅 ' + cells.length + ' 列')
    out.push({
      values,
      warnings,
      extra: [],
      raw: cells.join('\t'),
      ok: warnings.length === 0,
    })
  }
  return { records: out, headerFound: !!headerMap, skipped }
}

export function importXlsx(records, buffer) {
  const result = parseXlsx(buffer)
  if (result.error) return { error: true, added: 0, dup: 0, total: records.length, skipped: 0, headerFound: false, empty: true }
  if (!result.records.length) {
    return { added: 0, dup: 0, total: records.length, skipped: result.skipped, headerFound: result.headerFound, empty: true }
  }
  const res = appendRecords(records, result.records)
  return { added: res.added, dup: res.dup, total: res.total, skipped: result.skipped, headerFound: result.headerFound, empty: false }
}
