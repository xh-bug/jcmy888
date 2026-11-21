<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  FIELDS, SAMPLE, DEDUP_MODES, storageAvailable, parseAll, appendRecords,
  loadRecords, saveRecords, loadDedupMode, saveDedupMode,
  scanDuplicates, removeDuplicates,
  importText, importXlsx, toTSV, toXlsxMergedIP, fmtTime, findMode,
} from '../utils/accountParser'

const router = useRouter()

const records = ref(loadRecords())
const inputText = ref('')
const importTextValue = ref('')
const batchDevice = ref('')
const batchIp = ref('')
const dedupMode = ref(loadDedupMode())
const showSecrets = ref(false)
const fileInput = ref(null)

const toastMsg = ref('')
const toastShow = ref(false)
let toastTimer = null

const saveDialog = ref({ open: false, path: '', count: 0, mobile: false })

const editing = ref({ index: -1, key: '', value: '' })

const dedup = computed(() => scanDuplicates(records.value, dedupMode.value))

// 按 IP 分组展示：相同 IP 的记录排在一起，IP 单元格合并，不改动原始数据
const groupedRows = computed(() => {
  const map = new Map()
  records.value.forEach((rec, index) => {
    const ip = rec.values.ip || ''
    if (!map.has(ip)) map.set(ip, [])
    map.get(ip).push({ rec, index })
  })
  return Array.from(map, ([ip, items]) => ({ ip, items }))
})

const stats = computed(() => {
  let ok = 0
  let warn = 0
  records.value.forEach((r) => { r.ok ? ok++ : warn++ })
  return { total: records.value.length, ok, warn, dup: dedup.value.dupCount }
})

const dedupSummary = computed(() => dedup.value.dupCount
  ? '发现 ' + dedup.value.groups + ' 组重复，可清理 ' + dedup.value.dupCount + ' 条'
  : '当前规则下无重复')

const metaText = computed(() => records.value.length
  ? '累计 ' + records.value.length + ' 条 · 密码' + (showSecrets.value ? '已显示' : '已遮蔽') + ' · ' + (storageAvailable ? '本地已保存' : '仅本次会话')
  : '—')

function toast(msg) {
  toastMsg.value = msg
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastShow.value = false }, 1800)
}

async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      toast('已复制到剪贴板')
      return
    }
  } catch (e) { /* fall through */ }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    toast('已复制到剪贴板')
  } catch (e) {
    toast('复制失败，请手动选中文本')
  }
  document.body.removeChild(ta)
}

function persist() {
  return saveRecords(records.value)
}

function appendFromInput() {
  const parsed = parseAll(inputText.value)
  if (!parsed.length) { toast('输入为空，未新增数据'); return }
  const res = appendRecords(records.value, parsed, {
    deviceId: batchDevice.value,
    ip: batchIp.value,
  })
  const saved = res.added ? persist() : true
  inputText.value = ''
  let msg = '新增 ' + res.added + ' 条'
    + (res.dup ? '，跳过重复 ' + res.dup + ' 条' : '')
    + '，累计 ' + res.total + ' 条'
  if (!saved) msg += '（本地保存失败，请导出 CSV 备份）'
  toast(msg)
}

function fillSample() {
  inputText.value = SAMPLE
  toast('已填入示例，点击「解析并追加」即可入库')
}

function doImport(text) {
  const res = importText(records.value, String(text == null ? '' : text))
  if (res.added) persist()
  if (res.empty) {
    toast('未识别到可导入记录' + (res.skipped ? '，跳过 ' + res.skipped + ' 个空行' : ''))
    return
  }
  toast('导入新增 ' + res.added + ' 条'
    + (res.dup ? '，跳过重复 ' + res.dup + ' 条' : '')
    + (res.skipped ? '，忽略 ' + res.skipped + ' 个空行' : '')
    + '，累计 ' + res.total + ' 条'
    + (res.headerFound ? '（按表头映射）' : '（按列顺序映射）'))
}

function importFromText() {
  if (!importTextValue.value.trim()) { toast('请先粘贴内容或选择文件'); return }
  doImport(importTextValue.value)
}

function onFileChange(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const isXlsx = /\.xlsx$/i.test(file.name)

  if (isXlsx) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const res = importXlsx(records.value, ev.target.result)
      if (res.added) persist()
      if (res.error) {
        toast('Excel 文件读取失败')
        return
      }
      if (res.empty) {
        toast('未识别到可导入记录' + (res.skipped ? '，跳过 ' + res.skipped + ' 个空行' : ''))
      } else {
        toast('导入新增 ' + res.added + ' 条'
          + (res.dup ? '，跳过重复 ' + res.dup + ' 条' : '')
          + (res.skipped ? '，忽略 ' + res.skipped + ' 个空行' : '')
          + '，累计 ' + res.total + ' 条'
          + (res.headerFound ? '（按表头映射，IP 已还原）' : '（按列顺序映射）'))
      }
    }
    reader.onerror = () => toast('文件读取失败')
    reader.readAsArrayBuffer(file)
  } else {
    const reader = new FileReader()
    reader.onload = (ev) => {
      importTextValue.value = String((ev.target && ev.target.result) || '')
      doImport(importTextValue.value)
    }
    reader.onerror = () => toast('文件读取失败，请改用粘贴方式')
    reader.readAsText(file, 'UTF-8')
  }
  e.target.value = ''
}

function clearImport() {
  importTextValue.value = ''
  if (fileInput.value) fileInput.value.value = ''
  toast('导入框已清空')
}

function toggleSecrets() {
  showSecrets.value = !showSecrets.value
}

function copyAll() {
  if (!records.value.length) { toast('暂无可复制的记录'); return }
  copyText(toTSV(records.value))
}

function wipe() {
  if (!records.value.length) { toast('本地暂无记录'); return }
  if (!window.confirm('确认清空全部 ' + records.value.length + ' 条本地记录？此操作不可撤销，建议先导出 CSV 备份。')) return
  records.value = []
  const saved = persist()
  toast(saved ? '本地数据已清空' : '记录已从当前页面移除')
}

function changeDedup(e) {
  dedupMode.value = e.target.value
  saveDedupMode(dedupMode.value)
  toast('去重依据已切换：' + findMode(dedupMode.value).label)
}

function cleanDup() {
  if (!dedup.value.dupCount) { toast('当前规则下没有重复记录'); return }
  if (!window.confirm('按「' + findMode(dedupMode.value).label + '」清理 ' + dedup.value.dupCount + ' 条重复记录？每组只保留最早添加的一条，此操作不可撤销，建议先导出 CSV 备份。')) return
  const res = removeDuplicates(records.value, dedupMode.value)
  records.value = res.kept
  const saved = persist()
  toast(res.removed
    ? '已清理 ' + res.removed + ' 条重复，剩余 ' + res.remaining + ' 条' + (saved ? '' : '（本地保存失败）')
    : '无需清理')
}

async function saveList() {
  if (!records.value.length) { toast('暂无记录可保存'); return }
  const buffer = toXlsxMergedIP(records.value)
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const fileName = '账号解析结果.xlsx'
  const count = records.value.length

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'Excel 文件',
          accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
        }],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      saveDialog.value = { open: true, path: handle.name, count, mobile: false }
      return
    } catch (e) {
      if (e && e.name === 'AbortError') return
      // 不支持或出错时回退到普通下载
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  saveDialog.value = { open: true, path: fileName, count, mobile: true }
}

function closeSaveDialog() {
  saveDialog.value.open = false
}

function removeAt(index) {
  if (!window.confirm('确认移除第 ' + (index + 1) + ' 条记录？该操作会同步删除本地存储中的数据。')) return
  records.value.splice(index, 1)
  const saved = persist()
  toast(saved ? '已移除，剩余 ' + records.value.length + ' 条' : '已从当前页面移除')
}

function cellClass(rec, field) {
  const v = rec.values[field.key]
  const masked = field.secret && !showSecrets.value
  return {
    cell: true,
    empty: !v,
    masked,
    link: !!field.url,
  }
}

function cellText(rec, field) {
  const v = rec.values[field.key]
  if (!v) return '—'
  if (field.secret && !showSecrets.value) return '••••••••'
  return v
}

function onCellClick(rec, field) {
  const value = rec.values[field.key]
  if (!value) { toast('该字段为空'); return }
  copyText(value)
}

async function startEdit(index, key) {
  const rec = records.value[index]
  if (!rec) return
  editing.value = { index, key, value: rec.values[key] || '' }
  await nextTick()
  const el = document.querySelector('.inline-edit')
  if (el) { el.focus(); el.select() }
}

function commitEdit(save) {
  const { index, key, value } = editing.value
  editing.value = { index: -1, key: '', value: '' }
  if (index < 0) return
  const rec = records.value[index]
  if (!rec) return
  if (!save) return
  const val = String(value).trim()
  if (val === (rec.values[key] || '')) return
  rec.values[key] = val
  const label = key === 'deviceId' ? '手机编号' : 'IP'
  toast(persist() ? label + '已保存到本地' : label + '已更新（本地保存失败）')
}

function onKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    appendFromInput()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  if (records.value.length) {
    toast('已恢复本地数据，共 ' + records.value.length + ' 条')
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="account-page">
    <div class="wrap">
      <nav class="top-nav">
        <button type="button" class="back-home" @click="router.push('/')">← 返回首页</button>
        <span class="top-nav-title">佳成贸易</span>
      </nav>

      <header class="head">
        <div>
          <h1>账号数据解析工具</h1>
          <p>手机编号、IP 手动输入并排在最前；其余六项由 <code>----</code> 分隔的原始数据解析。结果累计保存在本地，支持导入回显与可视化去重。</p>
        </div>
        <div class="badge"><i></i>本地持久化 · 不联网</div>
      </header>

      <section class="card">
        <div class="card-head">
          <h2>新数据录入<span class="hint">每行一条记录，字段顺序固定</span></h2>
          <span class="hint">解析后追加到本地记录，不会覆盖已有数据</span>
        </div>
        <div class="card-body">
          <div class="field-order">
            <span class="manual"><b>1</b>手机编号 · 手动</span>
            <span class="manual"><b>2</b>IP · 手动</span>
            <span><b>3</b>账号</span>
            <span><b>4</b>密码</span>
            <span><b>5</b>邮箱账号</span>
            <span><b>6</b>邮箱密码</span>
            <span><b>7</b>邮箱解码链接</span>
            <span><b>8</b>地区</span>
          </div>
          <div class="manual-row">
            <label>
              <span>手机编号</span>
              <input v-model="batchDevice" type="text" autocomplete="off" spellcheck="false" placeholder="选填，如 01 / DY-001">
            </label>
            <label>
              <span>IP</span>
              <input v-model="batchIp" type="text" autocomplete="off" spellcheck="false" placeholder="选填，如 192.168.1.10">
            </label>
            <p class="manual-hint">这两项手动输入，不参与原始文本解析。填写后赋给本次新增的每条记录；表格中也可逐条点击填写或修改，改动即时写入本地存储。输入框本身不保存。</p>
          </div>
          <textarea v-model="inputText" spellcheck="false" placeholder="粘贴新的原始数据：账号----密码----邮箱账号----邮箱密码----链接----地区"></textarea>
          <div class="toolbar">
            <button class="primary" @click="appendFromInput">解析并追加 <span class="kbd">⌘/Ctrl + ↵</span></button>
            <button @click="fillSample">填入示例</button>
            <button class="ghost" @click="inputText = ''; toast('输入框已清空，本地记录保持不变')">清空输入框</button>
            <span class="spacer"></span>
            <button @click="copyAll">复制全部（TSV）</button>
            <button class="danger" @click="wipe">清空本地数据</button>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-head">
          <h2>导入此前导出的数据<span class="hint">Excel / CSV / TSV · 自动识别表头</span></h2>
          <span class="hint">去重追加，导入后即时回显</span>
        </div>
        <div class="card-body">
          <textarea id="importText" v-model="importTextValue" spellcheck="false" placeholder="粘贴 CSV / TSV 内容（含表头或纯数据行均可），或选择 Excel / CSV 文件自动读取"></textarea>
          <div class="toolbar">
            <button class="primary" @click="fileInput && fileInput.click()">选择文件（Excel / CSV）</button>
            <button @click="importFromText">导入并追加</button>
            <button class="ghost" @click="clearImport">清空导入框</button>
            <input ref="fileInput" type="file" accept=".xlsx,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/tab-separated-values" hidden @change="onFileChange">
          </div>
          <p class="import-hint">兼容本工具导出的 xlsx（IP 合并单元格会自动还原）、八列 / 六列 CSV，以及「复制全部」的 TSV 文本。按表头名映射列，列顺序可乱；无表头时按固定列顺序解析。文件读取与解析均在本地完成，不会上传；重复记录按当前去重依据跳过。</p>
        </div>
      </section>

      <section class="card">
        <div class="card-head">
          <h2>累计记录<span class="hint">点击字段值复制；手机编号 / IP 点击可编辑</span></h2>
          <span class="hint">{{ metaText }}</span>
        </div>
        <div class="stats">
          <div class="stat"><b>{{ stats.total }}</b><span>累计记录</span></div>
          <div class="stat ok"><b>{{ stats.ok }}</b><span>字段完整</span></div>
          <div class="stat warn"><b>{{ stats.warn }}</b><span>需留意</span></div>
          <div class="stat dup"><b>{{ stats.dup }}</b><span>重复可清理</span></div>
        </div>
        <div v-if="storageAvailable" class="storage-bar">
          <b>本地存储已启用。</b> 八个字段的记录保存在此浏览器的 localStorage 中（键名 <code>account-parser.records.v1</code>），关闭或重新打开页面数据仍在；新解析的记录按当前去重依据去重后追加。清理浏览器站点数据、更换浏览器或设备、使用无痕模式都会导致数据不可见或丢失，建议定期导出 CSV 备份。
        </div>
        <div v-else class="storage-bar" style="background: var(--warn-bg); border-color: #fde68a; color: #92400e;">
          当前浏览器未开放本地存储（可能处于无痕或受限模式），数据仅保留在本次页面会话中，刷新即丢失。请导出 CSV 备份。
        </div>
        <div class="dedup-bar">
          <span class="dedup-label">去重依据</span>
          <select :value="dedupMode" @change="changeDedup">
            <option v-for="m in DEDUP_MODES" :key="m.id" :value="m.id">{{ m.label }}</option>
          </select>
          <button class="danger" @click="cleanDup">清理重复</button>
            <button @click="toggleSecrets">{{ showSecrets ? '隐藏密码' : '显示密码' }}</button>
          <button class="primary" @click="saveList" title="保存为 Excel 文件">保存列表数据</button>
          <span class="dedup-summary" :class="{ 'has-dup': dedup.dupCount }">{{ dedupSummary }}</span>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th v-for="f in FIELDS" :key="f.key" :class="{ manual: f.manual }">{{ f.label }}</th>
                <th>添加时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="group in groupedRows" :key="group.ip || 'ip-empty-' + group.items[0].index">
                <tr
                  v-for="(item, rowIdx) in group.items"
                  :key="item.index"
                  :class="{ 'row-dup': dedup.flags[item.index] && dedup.flags[item.index].dup, 'row-warn': !item.rec.ok && !(dedup.flags[item.index] && dedup.flags[item.index].dup) }"
                >
                  <td class="idx">{{ String(item.index + 1).padStart(2, '0') }}</td>
                  <template v-for="f in FIELDS" :key="f.key">
                    <template v-if="f.key !== 'ip' || rowIdx === 0">
                      <td
                        v-if="f.key === 'ip'"
                        :rowspan="group.items.length"
                        :class="['center-cell', 'ip-cell', { 'ip-group-cell': group.items.length > 1 }]"
                      >
                        <input
                          v-if="editing.index === item.index && editing.key === 'ip'"
                          v-model="editing.value"
                          class="inline-edit"
                          type="text"
                          @keydown.enter.prevent="commitEdit(true)"
                          @keydown.esc.prevent="commitEdit(false)"
                          @blur="commitEdit(true)"
                        >
                        <span
                          v-else
                          class="cell manual"
                          :class="{ empty: !group.ip }"
                          :title="group.ip ? '点击修改本条 IP' : '点击填写 IP'"
                          @click="startEdit(item.index, 'ip')"
                        >{{ group.ip || '点击填写' }}</span>
                      </td>
                      <td v-else-if="f.manual" class="center-cell">
                        <input
                          v-if="editing.index === item.index && editing.key === f.key"
                          v-model="editing.value"
                          class="inline-edit"
                          type="text"
                          @keydown.enter.prevent="commitEdit(true)"
                          @keydown.esc.prevent="commitEdit(false)"
                          @blur="commitEdit(true)"
                        >
                        <span
                          v-else
                          class="cell manual"
                          :class="{ empty: !item.rec.values[f.key] }"
                          :title="item.rec.values[f.key] ? '点击修改' + f.label : '点击填写' + f.label"
                          @click="startEdit(item.index, f.key)"
                        >{{ item.rec.values[f.key] || '点击填写' }}</span>
                      </td>
                      <td v-else-if="f.key === 'region'" class="nowrap-cell">
                        <span v-if="item.rec.values[f.key]" class="region" @click="onCellClick(item.rec, f)">{{ item.rec.values[f.key] }}</span>
                        <span v-else class="cell empty" @click="onCellClick(item.rec, f)">—</span>
                      </td>
                      <td v-else>
                        <span
                          :class="[cellClass(item.rec, f), { 'nowrap-cell': ['account', 'password', 'email', 'emailPassword', 'decodeUrl'].includes(f.key) }]"
                          :title="item.rec.values[f.key] ? (f.url ? item.rec.values[f.key] + '（点击复制）' : '点击复制') : '字段为空'"
                          @click="onCellClick(item.rec, f)"
                        >{{ cellText(item.rec, f) }}</span>
                        <a
                          v-if="f.url && item.rec.values[f.key] && /^https?:\/\//i.test(item.rec.values[f.key])"
                          class="visit"
                          :href="item.rec.values[f.key]"
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          title="打开第三方链接前请确认来源可信"
                          @click.stop
                        >访问</a>
                      </td>
                    </template>
                  </template>
                  <td><span class="time">{{ fmtTime(item.rec.addedAt) }}</span></td>
                  <td>
                    <span class="status" :class="item.rec.ok ? 'ok' : 'warn'" :title="item.rec.ok ? '' : item.rec.warnings.join('\n') + (item.rec.extra.length ? '\n多余内容：' + item.rec.extra.join(' | ') : '')">
                      {{ item.rec.ok ? '正常' : '需留意' }}
                    </span>
                    <span v-if="dedup.flags[item.index] && dedup.flags[item.index].dup" class="dup-tag" title="按当前去重依据与前面的记录重复；点击「清理重复」将移除本条">重复</span>
                    <span v-else-if="dedup.flags[item.index] && dedup.flags[item.index].inGroup && dedup.flags[item.index].keeper" class="keep-tag" title="同组中最早添加的一条，清理时保留">保留</span>
                  </td>
                  <td><button type="button" class="mini" title="从本地存储中移除该条记录" @click="removeAt(item.index)">移除</button></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div v-if="!records.length" class="empty-state">本地暂无记录，粘贴数据后点击「解析并追加」。</div>
      </section>

      <section class="card">
        <div class="card-head"><h2>规则与安全说明</h2></div>
        <div class="notes">
          <div class="note">
            <h3>解析规则</h3>
            <ul>
              <li>「手机编号」「IP」为手动字段，排在最前，不参与 <code>----</code> 分隔解析。</li>
              <li>原始文本仍按六段解析：账号 / 密码 / 邮箱账号 / 邮箱密码 / 链接 / 地区。</li>
              <li>兼容 Markdown 形式的链接 <code>[链接](链接)</code>：自动取括号内的真实地址，并剔除末尾多余的 <code>----</code>。</li>
              <li>兼容地区紧贴右括号的写法，如 <code>…)墨西哥</code>；链接内部含分隔符时会尝试自动合并还原。</li>
            </ul>
          </div>
          <div class="note">
            <h3>去重与导入</h3>
            <ul>
              <li>去重依据同时作用于「追加 / 导入时自动跳过」与「手动清理重复」，切换后立即重新标记，设置保存在本地。</li>
              <li>重复行以浅红底色标出，第 2 条及之后标「重复」，每组第 1 条标「保留」；清理时每组只保留最早添加的一条。</li>
              <li>导入支持 xlsx（IP 合并单元格自动还原）、八列 / 六列 CSV 与 TSV，按表头名映射，导入即回显并写入本地存储。</li>
              <li>导出为 xlsx（IP 在第一列并合并相同项）/ 复制 TSV 按八列顺序输出；手动字段可在表格中逐条编辑，旧记录缺少时自动补空值。</li>
            </ul>
          </div>
          <div class="note">
            <h3>已知限制</h3>
            <ul>
              <li>字段值本身不能包含 <code>----</code>，该序列被保留为分隔符。</li>
              <li>导入按逗号或制表符分列；含分隔符的字段需用双引号包裹，字段内换行仅 CSV 可承载。</li>
              <li>无表头的导入文本按列数判断：≤6 列按旧六字段顺序，≥7 列按八字段顺序。</li>
              <li>清理重复不可撤销，执行前会二次确认并提示条数，建议先导出 CSV 备份。</li>
              <li>数据不跨浏览器、不跨设备同步；localStorage 容量约 5 MB，超量会写入失败并提示。</li>
              <li>本地存储按「来源」隔离：本地文件（<code>file://</code>）与预览服务（<code>http://127.0.0.1</code>）是两份互不相通的数据，请固定一种打开方式。</li>
            </ul>
          </div>
          <div class="note risk">
            <h3>凭证数据处理提示</h3>
            <p>本页无外部脚本、无网络请求，但为了满足持久化需求，账号、密码、邮箱密码以<b>明文</b>保存在浏览器本地存储中，同源页面及本机使用者可读取。请勿在共用或公共设备上使用；用完请导出 CSV 备份并点击「清空本地数据」。密码默认遮蔽；只有 http/https 链接才会生成「访问」入口，工具本身不会自动请求任何链接。导入内容同样只在本机解析，不会上传。</p>
          </div>
        </div>
      </section>
    </div>

    <div class="toast" :class="{ show: toastShow }" role="status" aria-live="polite">{{ toastMsg }}</div>

    <div v-if="saveDialog.open" class="save-mask" @click.self="closeSaveDialog">
      <div class="save-dialog">
        <div class="save-icon">✓</div>
        <h3>保存成功</h3>
        <p class="save-count">共 {{ saveDialog.count }} 条记录已导出为 Excel 文件</p>
        <p class="save-path">{{ saveDialog.path }}</p>
        <p v-if="saveDialog.mobile" class="save-note">文件已保存到手机的默认下载目录，可在「下载」或「文件」应用中查看。</p>
        <p v-else class="save-note">文件已保存到你选择的位置。</p>
        <button type="button" class="primary save-ok" @click="closeSaveDialog">知道了</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.account-page {
  --bg: #f4f6fa;
  --surface: #ffffff;
  --surface-soft: #f8fafc;
  --border: #e2e8f0;
  --border-strong: #cbd5e1;
  --text: #0f172a;
  --text-sub: #64748b;
  --text-mute: #94a3b8;
  --primary: #2563eb;
  --primary-soft: #eff6ff;
  --ok: #0f766e;
  --ok-bg: #ecfdf5;
  --warn: #b45309;
  --warn-bg: #fffbeb;
  --danger: #b91c1c;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;

  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
.account-page * { box-sizing: border-box; }

.wrap { max-width: 1360px; margin: 0 auto; padding: 32px 24px 56px; }

.top-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}
.back-home {
  font-size: 13px;
  padding: 6px 12px;
  color: var(--primary);
  border-color: #bfdbfe;
  background: var(--primary-soft);
}
.back-home:hover { background: #dbeafe; border-color: var(--primary); }
.top-nav-title { font-size: 13px; color: var(--text-sub); }

.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
.head h1 { font-size: 24px; font-weight: 650; letter-spacing: -.02em; margin: 0 0 6px; }
.head p { margin: 0; color: var(--text-sub); font-size: 13px; }
.badge {
  flex: none; display: inline-flex; align-items: center; gap: 8px;
  background: var(--ok-bg); color: var(--ok); border: 1px solid #a7f3d0;
  border-radius: 999px; padding: 7px 14px; font-size: 12px; font-weight: 600; white-space: nowrap;
}
.badge i { width: 7px; height: 7px; border-radius: 50%; background: var(--ok); display: block; }

.card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15,23,42,.04), 0 6px 20px rgba(15,23,42,.03);
  margin-bottom: 20px; overflow: hidden;
}
.card-head {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 16px 20px; border-bottom: 1px solid var(--border); background: var(--surface-soft);
}
.card-head h2 { font-size: 14px; font-weight: 650; margin: 0; letter-spacing: .01em; }
.card-head .hint { font-size: 12px; color: var(--text-mute); font-weight: 400; margin-left: 10px; }
.card-body { padding: 20px; }

textarea {
  width: 100%; min-height: 132px; resize: vertical; display: block;
  border: 1px solid var(--border-strong); border-radius: 8px; background: #fff;
  padding: 14px 16px; color: var(--text); font-family: var(--mono); font-size: 12.5px;
  line-height: 1.8; outline: none; transition: border-color .15s, box-shadow .15s;
}
textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
textarea::placeholder { color: var(--text-mute); font-family: var(--sans); }
#importText { min-height: 96px; }
.import-hint { margin: 12px 0 0; font-size: 11.5px; color: var(--text-mute); line-height: 1.6; }

.field-order { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 14px; }
.field-order span {
  font-size: 11.5px; color: var(--text-sub); background: var(--surface-soft);
  border: 1px solid var(--border); border-radius: 5px; padding: 3px 9px;
}
.field-order span b { color: var(--primary); font-weight: 600; margin-right: 4px; }
.field-order span.manual { background: var(--primary-soft); border-color: #bfdbfe; color: #1e40af; }
.field-order span.manual b { color: var(--primary); }

.manual-row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; margin: 0 0 14px; }
.manual-row label { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: var(--text-sub); }
.manual-row label span { font-weight: 600; color: var(--text); }
.manual-row input[type=text] {
  width: 220px; padding: 8px 11px; border: 1px solid var(--border-strong); border-radius: 7px;
  font-family: var(--mono); font-size: 12.5px; color: var(--text); background: #fff; outline: none;
}
.manual-row input[type=text]:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.manual-hint { flex-basis: 100%; margin: 0; font-size: 11.5px; color: var(--text-mute); line-height: 1.6; }

.toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; align-items: center; }
button {
  font-family: inherit; font-size: 13px; font-weight: 550; cursor: pointer;
  border-radius: 7px; padding: 8px 15px; border: 1px solid var(--border-strong);
  background: #fff; color: var(--text); transition: background .15s, border-color .15s, transform .05s;
}
button:hover { background: var(--surface-soft); border-color: #94a3b8; }
button:active { transform: translateY(1px); }
button.primary { background: var(--primary); border-color: var(--primary); color: #fff; }
button.primary:hover { background: #1d4ed8; border-color: #1d4ed8; }
button.ghost { border-color: transparent; background: transparent; color: var(--text-sub); }
button.ghost:hover { background: var(--surface-soft); color: var(--text); }
button.danger { color: var(--danger); border-color: #fecaca; }
button.danger:hover { background: #fef2f2; border-color: #fca5a5; }
button.mini { font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 5px; color: var(--text-sub); white-space: nowrap; }
button.mini:hover { color: var(--danger); border-color: #fca5a5; background: #fef2f2; }
.toolbar .spacer { flex: 1; }
.kbd { font-size: 11px; color: var(--text-mute); font-family: var(--mono); margin-left: 2px; }

.stats { display: flex; flex-wrap: wrap; gap: 10px; padding: 14px 20px 12px; }
.stat {
  display: flex; align-items: baseline; gap: 8px; background: var(--surface-soft);
  border: 1px solid var(--border); border-radius: 7px; padding: 7px 12px;
}
.stat b { font-size: 17px; font-weight: 650; font-variant-numeric: tabular-nums; }
.stat span { font-size: 12px; color: var(--text-sub); }
.stat.ok b { color: var(--ok); }
.stat.warn b { color: var(--warn); }
.stat.dup b { color: var(--danger); }
.storage-bar {
  margin: 0 20px 12px; padding: 11px 14px; border-radius: 8px;
  background: var(--primary-soft); border: 1px solid #bfdbfe;
  color: #1e40af; font-size: 12px; line-height: 1.75;
}
.storage-bar b { font-weight: 650; }

.dedup-bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
  margin: 0 20px 16px; padding: 11px 14px; border-radius: 8px;
  background: var(--surface-soft); border: 1px solid var(--border);
}
.dedup-label { font-size: 12px; font-weight: 600; color: var(--text-sub); white-space: nowrap; }
.dedup-bar select {
  font-family: inherit; font-size: 12.5px; color: var(--text); background: #fff;
  border: 1px solid var(--border-strong); border-radius: 6px; padding: 6px 10px; outline: none;
}
.dedup-bar select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.dedup-bar button { padding: 6px 12px; font-size: 12px; }
.dedup-summary { margin-left: auto; font-size: 12px; color: var(--text-sub); white-space: nowrap; }
.dedup-summary.has-dup { color: var(--danger); font-weight: 600; }

.table-scroll { overflow-x: auto; border-top: 1px solid var(--border); }
table { width: 100%; border-collapse: collapse; min-width: 1360px; font-size: 13px; border: 1px solid var(--border-strong); }
thead th {
  position: sticky; top: 0; background: var(--surface-soft); text-align: left;
  font-size: 11.5px; font-weight: 650; color: var(--text-sub); letter-spacing: .03em;
  padding: 11px 14px; border: 1px solid var(--border-strong); white-space: nowrap;
}
thead th.manual { color: var(--primary); background: #f3f8ff; }
tbody td { padding: 12px 14px; border: 1px solid var(--border-strong); vertical-align: middle; }
tbody tr:hover { background: #fafcff; }
tbody tr.row-warn { background: #fffcf5; }
tbody tr.row-warn:hover { background: #fff8e8; }
tbody tr.row-dup { background: #fff5f5; }
tbody tr.row-dup:hover { background: #ffecec; }
.idx { color: var(--text-mute); font-family: var(--mono); font-size: 12px; width: 44px; }
.cell {
  font-family: var(--mono); font-size: 12px; color: var(--text); word-break: break-all;
  cursor: pointer; border-radius: 4px; padding: 2px 4px; margin: -2px -4px; display: inline-block; max-width: 100%;
}
.cell:hover { background: var(--primary-soft); color: var(--primary); }
.cell.empty { color: var(--text-mute); font-family: var(--sans); }
.cell.masked { letter-spacing: .12em; color: var(--text-sub); }
.cell.link { max-width: 310px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: bottom; }
.cell.manual { border-bottom: 1px dashed var(--border-strong); border-radius: 0; color: var(--text); }
.cell.manual.empty { color: var(--text-mute); font-family: var(--sans); }
.ip-cell { min-width: 320px; }
.ip-cell .inline-edit { width: 280px; }
.ip-group-cell { vertical-align: middle; }
.ip-group-cell .cell { color: var(--danger); font-weight: 600; white-space: nowrap; }
.ip-group-cell .cell:hover { color: #dc2626; background: #fef2f2; }
.ip-group-cell .cell.empty { color: var(--text-mute); }
.nowrap-cell { white-space: nowrap; word-break: normal; }
.center-cell { text-align: center; }
.inline-edit {
  width: 140px; padding: 4px 7px; border: 1px solid var(--primary); border-radius: 5px;
  font-family: var(--mono); font-size: 12px; color: var(--text); outline: none;
  box-shadow: 0 0 0 2px rgba(37,99,235,.12);
}
.region { display: inline-block; background: var(--primary-soft); color: var(--primary); border-radius: 5px; padding: 2px 9px; font-size: 12px; font-weight: 550; cursor: pointer; }
.status { font-size: 11.5px; font-weight: 600; white-space: nowrap; }
.status.ok { color: var(--ok); }
.status.warn { color: var(--warn); }
.dup-tag, .keep-tag {
  display: inline-block; margin-left: 6px; font-size: 10.5px; font-weight: 600;
  border-radius: 4px; padding: 1px 6px; white-space: nowrap;
}
.dup-tag { color: var(--danger); background: #fee2e2; }
.keep-tag { color: var(--primary); background: #dbeafe; }
.time { font-family: var(--mono); font-size: 11.5px; color: var(--text-mute); white-space: nowrap; }
.visit {
  display: inline-block; margin-left: 8px; font-size: 11px; color: var(--text-sub);
  text-decoration: none; border: 1px solid var(--border); border-radius: 5px; padding: 1px 7px; vertical-align: 2px;
}
.visit:hover { color: var(--primary); border-color: var(--primary); }
.empty-state { padding: 56px 20px; text-align: center; color: var(--text-mute); font-size: 13px; }

.notes { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; padding: 18px 20px; }
.note h3 { font-size: 12.5px; font-weight: 650; margin: 0 0 8px; color: var(--text); }
.note p, .note li { font-size: 12px; color: var(--text-sub); margin: 0; line-height: 1.8; }
.note ul { margin: 0; padding-left: 18px; }
.note.risk { background: var(--warn-bg); border-radius: 8px; padding: 14px 16px; }
.note.risk h3 { color: var(--warn); }
.note.risk p { color: #92400e; }
code { font-family: var(--mono); background: #eef2f7; border-radius: 3px; padding: 1px 5px; font-size: 11.5px; color: #334155; }

.toast {
  position: fixed; left: 50%; bottom: 28px; transform: translate(-50%, 12px);
  background: #0f172a; color: #fff; font-size: 12.5px; padding: 10px 18px; border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15,23,42,.22); opacity: 0; pointer-events: none;
  transition: opacity .18s, transform .18s; z-index: 99;
}
.toast.show { opacity: 1; transform: translate(-50%, 0); }

.save-mask {
  position: fixed; inset: 0; z-index: 200; display: grid; place-items: center;
  background: rgba(15, 23, 42, .55); padding: 20px;
}
.save-dialog {
  width: min(420px, 100%); background: #fff; border-radius: 18px;
  padding: 40px 32px 32px; text-align: center;
  box-shadow: 0 24px 70px rgba(15, 23, 42, .35);
}
.save-icon {
  width: 72px; height: 72px; margin: 0 auto 20px;
  display: grid; place-items: center; border-radius: 50%;
  background: var(--ok-bg); color: var(--ok);
  font-size: 38px; font-weight: 700; line-height: 1;
  border: 3px solid #a7f3d0;
}
.save-dialog h3 { margin: 0 0 12px; font-size: 26px; color: var(--text); }
.save-count { margin: 0 0 10px; font-size: 16px; color: var(--text); font-weight: 600; }
.save-path {
  margin: 0 0 18px; font-family: var(--mono); font-size: 13px;
  color: var(--primary); background: var(--surface-soft);
  border: 1px solid var(--border); border-radius: 8px;
  padding: 10px; word-break: break-all;
}
.save-note { margin: 0 0 24px; font-size: 13px; color: var(--text-sub); line-height: 1.7; }
.save-ok { width: 100%; padding: 12px; font-size: 16px; }

@media (max-width: 720px) {
  .wrap { padding: 20px 14px 40px; }
  .head { flex-direction: column; gap: 12px; }
  .card-body { padding: 16px; }
  .toolbar .spacer { display: none; }
  .storage-bar { margin: 0 16px 12px; }
  .dedup-bar { margin: 0 16px 14px; }
  .dedup-summary { margin-left: 0; flex-basis: 100%; }
  .manual-row input[type=text] { width: 100%; }
}
</style>
