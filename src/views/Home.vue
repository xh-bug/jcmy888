<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentYear = new Date().getFullYear()
const profileOpen = ref(false)
const activePerson = ref(null)
const baseUrl = import.meta.env.BASE_URL

const markets = [
  { code: 'US', name: '美国站', text: '选品 · 本地化 · 店铺运营' },
  { code: 'MX', name: '墨西哥站', text: '拉美市场 · 供应链匹配' },
  { code: 'UK', name: '英国站', text: '达人合作 · 内容增长' },
  { code: 'EU', name: '欧洲站', text: '多渠道 · 区域拓展' },
]

const services = [
  { number: '01', title: '全球选品', text: '结合市场趋势与数据模型，筛选更具潜力的爆款商品。' },
  { number: '02', title: '店铺运营', text: '覆盖上架、内容、投放、客服及供应链协同管理。' },
  { number: '03', title: '本地增长', text: '链接达人与本地资源，帮助品牌快速建立市场影响力。' },
]

const team = [
  {
    role: '董事长',
    name: '陈先生',
    initials: '董',
    image: `${baseUrl}jc.png`,
    title: 'Chairman',
    bio: '统筹集团战略与跨境业务布局，深耕美区、墨西哥、英区及欧洲市场，致力于长期、稳定的合作发展。',
    position: '集团战略与跨境业务负责人',
    focus: ['全球战略', '市场合作', '资源整合'],
    experience: '6+',
    markets: '美区 / 欧区',
    mode: '战略协作',
  },
 {
  role: '总经理',
  name: '江女士',
  initials: '江',
  image: '',
  title: 'General Manager',
  bio: '负责TikTok业务整体市场运营、团队管理与全球化业务落地，持续提升店铺增长效率与客户服务体验。',
  position: '市场运营与团队管理负责人',
  focus: ['市场战略', '团队管理', '全球化落地'],
  experience: '10+年',
  markets: '墨西哥 / 英国（英区）',
  mode: '日常运营',
},
{
  role: '总监',
  name: '万先生',
  initials: '万',
  image: '',
  title: 'Director',
  bio: '负责TikTok日常运营统筹、店铺增长执行与跨团队协同，推动市场拓展和客户服务体验持续优化。',
  position: '市场运营执行与团队协同负责人',
  focus: ['店铺运营', '市场拓展执行', '团队协同'],
  experience: '10+年',
  markets: '墨西哥 / 英国（英区）',
  mode: '日常运营',
},
]

function openProfile(person) {
  activePerson.value = person
  profileOpen.value = true
}

function closeProfile() {
  profileOpen.value = false
  activePerson.value = null
}

function handleKeydown(event) {
  if (event.key === 'Escape') closeProfile()
}

window.addEventListener('keydown', handleKeydown)
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="site-shell">
    <header class="header">
      <button class="brand" type="button" aria-label="返回首页" @click="router.push('/')">
        <span class="brand-symbol">JC</span>
        <span class="brand-text">
          <strong>佳成贸易</strong>
          <small>跨境增长伙伴</small>
        </span>
      </button>

      <nav class="nav" aria-label="主导航">
        <button type="button" class="nav-link active" @click="router.push('/')">首页</button>
        <button type="button" class="nav-link" @click="router.push('/account')">工具中心</button>
      </nav>
    </header>

    <main>
      <section class="hero">
        <div class="hero-copy">
          <div class="status-pill">
            <span></span>
            面向全球市场的跨境电商服务
          </div>
          <h1>让好产品<br />走向世界。</h1>
          <p>
            从市场洞察、店铺运营到达人合作与本地增长，
            一站式助力品牌进入全球市场。
          </p>
          <div class="hero-actions">
          </div>
        </div>

        <div class="hero-visual" aria-label="全球市场数据展示">
          <div class="orbit orbit-one"></div>
          <div class="orbit orbit-two"></div>
          <div class="globe">
            <span class="globe-shine"></span>
            <span class="globe-grid"></span>
          </div>
          <div class="market-chip chip-us"><b>US</b><span>North America</span></div>
          <div class="market-chip chip-mx"><b>MX</b><span>Latin America</span></div>
          <div class="market-chip chip-eu"><b>EU</b><span>Europe</span></div>
        </div>
      </section>

      <section class="market-strip" aria-label="覆盖市场">
        <div class="strip-label">
          <span>覆盖市场</span>
          <small>GLOBAL MARKETS</small>
        </div>
        <div class="market-grid">
          <article v-for="market in markets" :key="market.code" class="market-card">
            <span class="market-code">{{ market.code }}</span>
            <div>
              <strong>{{ market.name }}</strong>
              <small>{{ market.text }}</small>
            </div>
          </article>
        </div>
      </section>

      <section class="content-grid">
        <div class="services">
          <div class="section-heading">
            <div>
              <span class="section-kicker">核心服务</span>
              <h2>打造全球增长能力</h2>
            </div>
            <span class="section-index">01—03</span>
          </div>

          <div class="service-list">
            <article v-for="service in services" :key="service.number" class="service-card">
              <span class="service-number">{{ service.number }}</span>
              <div>
                <h3>{{ service.title }}</h3>
                <p>{{ service.text }}</p>
              </div>
              <span class="service-arrow">↗</span>
            </article>
          </div>
        </div>

        <aside class="team-panel" aria-label="核心团队">
          <div class="team-heading">
            <span>核心团队</span>
            <small>02 MEMBERS</small>
          </div>
          <button
            v-for="(person, index) in team"
            :key="person.role"
            type="button"
            class="team-card"
            @click="openProfile(person)"
          >
            <span class="team-number">0{{ index + 1 }}</span>
            <span class="team-avatar">
              <img v-if="person.image" :src="person.image" :alt="person.name" />
              <span v-else>{{ person.initials }}</span>
            </span>
            <span class="team-info">
              <small>{{ person.role }}</small>
              <strong>{{ person.name }}</strong>
            </span>
            <span class="team-arrow">↗</span>
          </button>
        </aside>
      </section>
    </main>

    <footer class="footer">
      <span>佳成贸易 © {{ currentYear }}</span>
      <span>全球市场 · 本地增长 · 长期合作</span>
    </footer>

    <Transition name="modal">
      <div v-if="profileOpen && activePerson" class="modal-backdrop" role="presentation" @click="closeProfile">
        <section
          class="profile-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-name"
          @click.stop
        >
          <button type="button" class="close-button" aria-label="关闭" @click="closeProfile">×</button>
          <div class="profile-cover">
            <span>PERSONAL PROFILE</span>
            <span class="profile-avatar">
              <img v-if="activePerson.image" :src="activePerson.image" :alt="activePerson.name" />
              <span v-else>{{ activePerson.initials }}</span>
            </span>
          </div>
          <div class="profile-content">
            <small>{{ activePerson.title }}</small>
            <h2 id="profile-name">{{ activePerson.name }}</h2>
            <p class="profile-position">{{ activePerson.position }}</p>
            <p>{{ activePerson.bio }}</p>
            <div class="profile-focus" aria-label="业务重点">
              <span v-for="item in activePerson.focus" :key="item">{{ item }}</span>
            </div>
            <div class="profile-stats">
              <div>
                <strong>{{ activePerson.experience }}</strong>
                <span>行业经验</span>
              </div>
              <div>
                <strong>{{ activePerson.markets }}</strong>
                <span>重点市场</span>
              </div>
              <div>
                <strong>{{ activePerson.mode }}</strong>
                <span>工作方式</span>
              </div>
            </div>
            <div class="profile-footer">
              <span>佳成贸易</span>
              <span>{{ activePerson.role }}</span>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.site-shell {
  min-height: 100vh;
  background: #f7f8f4;
  color: #16231d;
  overflow: hidden;
}

.header {
  height: 78px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(20px, 5vw, 72px);
  border-bottom: 1px solid rgba(22, 35, 29, .09);
  background: rgba(247, 248, 244, .92);
  backdrop-filter: blur(14px);
  position: relative;
  z-index: 10;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  border: 0;
  background: transparent;
  color: #16231d;
  padding: 0;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.brand-symbol {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #203c30;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: -.04em;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-text strong {
  font-size: 14px;
  letter-spacing: .12em;
}

.brand-text small {
  color: #8e9a94;
  font-size: 8px;
  letter-spacing: .08em;
}

.nav {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-left: auto;
}

.nav-link {
  height: 78px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #7d8983;
  padding: 0;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}

.nav-link.active {
  border-bottom-color: #315744;
  color: #20372c;
}

.hero {
  min-height: 500px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  padding: 54px clamp(20px, 7vw, 100px) 38px;
  border-bottom: 1px solid rgba(22, 35, 29, .08);
  background:
    radial-gradient(circle at 78% 48%, rgba(100, 146, 123, .14), transparent 22rem),
    #f7f8f4;
}

.hero-copy {
  max-width: 590px;
  position: relative;
  z-index: 2;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  border: 1px solid rgba(49, 87, 68, .12);
  border-radius: 999px;
  background: rgba(255, 255, 255, .58);
  color: #718078;
  padding: 0 12px;
  font-size: 9px;
  letter-spacing: .08em;
}

.status-pill span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #70a388;
  box-shadow: 0 0 0 4px rgba(112, 163, 136, .11);
}

.hero h1 {
  margin: 24px 0 20px;
  color: #1e3328;
  font-family: Georgia, "Times New Roman", "Songti SC", serif;
  font-size: clamp(58px, 6.5vw, 92px);
  line-height: .98;
  font-weight: 500;
  letter-spacing: -.055em;
}

.hero-copy > p {
  max-width: 480px;
  margin: 0;
  color: #738078;
  font-size: 14px;
  line-height: 1.9;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.hero-visual {
  height: 410px;
  position: relative;
  display: grid;
  place-items: center;
}

.globe {
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 28%, rgba(255, 255, 255, .32), transparent 10%),
    linear-gradient(145deg, #9db5a7 0%, #4f7a64 54%, #294936 100%);
  box-shadow:
    inset -28px -20px 50px rgba(24, 65, 45, .24),
    0 30px 70px rgba(52, 91, 72, .18);
  position: relative;
  overflow: hidden;
}

.globe::before,
.globe::after {
  content: '';
  position: absolute;
  border: 1px solid rgba(255, 255, 255, .12);
  border-radius: 50%;
}

.globe::before {
  width: 72%;
  height: 108%;
  left: 14%;
  top: -4%;
}

.globe::after {
  width: 118%;
  height: 42%;
  left: -9%;
  top: 29%;
}

.globe-grid {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, transparent 49.5%, rgba(255, 255, 255, .10) 50%, transparent 50.5%),
    linear-gradient(transparent 49.5%, rgba(255, 255, 255, .10) 50%, transparent 50.5%);
}

.orbit {
  position: absolute;
  border: 1px solid rgba(49, 87, 68, .14);
  border-radius: 50%;
  transform: rotate(-20deg);
}

.orbit-one {
  width: 390px;
  height: 210px;
}

.orbit-two {
  width: 430px;
  height: 290px;
  transform: rotate(28deg);
}

.market-chip {
  position: absolute;
  min-width: 132px;
  height: 50px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(49, 87, 68, .11);
  border-radius: 8px;
  background: rgba(255, 255, 252, .88);
  box-shadow: 0 12px 30px rgba(48, 73, 61, .09);
  padding: 8px 10px;
  backdrop-filter: blur(8px);
}

.market-chip b {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: #edf2ed;
  color: #4c6858;
  font-size: 9px;
}

.market-chip span {
  color: #87938d;
  font-size: 8px;
}

.chip-us { left: 6%; top: 22%; }
.chip-mx { right: 2%; bottom: 18%; }
.chip-eu { left: 2%; bottom: 10%; }

.market-strip {
  min-height: 118px;
  display: grid;
  grid-template-columns: 180px 1fr;
  align-items: stretch;
  padding: 0 clamp(20px, 7vw, 100px);
  border-bottom: 1px solid rgba(22, 35, 29, .08);
  background: #fff;
}

.strip-label {
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-right: 1px solid rgba(22, 35, 29, .08);
}

.strip-label span {
  font-size: 13px;
  font-weight: 700;
}

.strip-label small {
  margin-top: 5px;
  color: #a1aaa5;
  font-size: 8px;
  letter-spacing: .12em;
}

.market-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.market-card {
  display: flex;
  align-items: center;
  gap: 12px;
  border-right: 1px solid rgba(22, 35, 29, .08);
  padding: 20px;
}

.market-card:last-child { border-right: 0; }

.market-code {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #edf2ed;
  color: #587364;
  font-size: 9px;
  font-weight: 700;
}

.market-card div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.market-card strong {
  font-size: 12px;
}

.market-card small {
  color: #929d97;
  font-size: 8px;
  line-height: 1.5;
}

.content-grid {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, .45fr);
  gap: 36px;
  padding: 70px 20px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 18px;
}

.section-kicker {
  color: #95a099;
  font-size: 9px;
  letter-spacing: .14em;
}

.section-heading h2 {
  margin: 7px 0 0;
  color: #26382f;
  font-size: 24px;
  letter-spacing: -.02em;
}

.section-index {
  color: #adb6b1;
  font-family: Georgia, serif;
  font-size: 12px;
  font-style: italic;
}

.service-list {
  border-top: 1px solid rgba(22, 35, 29, .10);
}

.service-card {
  min-height: 94px;
  display: grid;
  grid-template-columns: 54px 1fr 30px;
  align-items: center;
  border-bottom: 1px solid rgba(22, 35, 29, .10);
}

.service-number {
  color: #adb6b1;
  font-family: Georgia, serif;
  font-size: 11px;
  font-style: italic;
}

.service-card h3 {
  margin: 0 0 6px;
  font-size: 15px;
}

.service-card p {
  margin: 0;
  color: #87938d;
  font-size: 10px;
  line-height: 1.6;
}

.service-arrow {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(49, 87, 68, .12);
  border-radius: 50%;
  color: #65766d;
  font-size: 10px;
}

.team-panel {
  border: 1px solid rgba(22, 35, 29, .10);
  border-radius: 14px;
  background: rgba(255, 255, 252, .78);
  padding: 18px;
}

.team-heading {
  height: 42px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  color: #68776f;
  font-size: 11px;
  letter-spacing: .08em;
}

.team-heading small {
  color: #adb6b1;
  font-size: 8px;
}

.team-card {
  width: 100%;
  height: 94px;
  display: grid;
  grid-template-columns: 30px 54px 1fr 28px;
  align-items: center;
  border: 0;
  border-top: 1px solid rgba(22, 35, 29, .08);
  background: transparent;
  color: #26382f;
  padding: 10px 0;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.team-card:hover { background: rgba(49, 87, 68, .025); }

.team-number {
  color: #adb6b1;
  font-family: Georgia, serif;
  font-size: 10px;
  font-style: italic;
}

.team-avatar {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #e8ede7;
  color: #557064;
  font-family: Georgia, "Songti SC", serif;
  font-size: 16px;
  overflow: hidden;
}

.team-avatar img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.team-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.team-info small {
  color: #98a49e;
  font-size: 8px;
  letter-spacing: .08em;
}

.team-info strong {
  font-size: 13px;
}

.team-arrow {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(49, 87, 68, .12);
  border-radius: 50%;
  color: #65766d;
  font-size: 9px;
}

.footer {
  height: 66px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(20px, 5vw, 72px);
  border-top: 1px solid rgba(22, 35, 29, .08);
  color: #98a49e;
  font-size: 8px;
  letter-spacing: .10em;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(25, 38, 31, .42);
  backdrop-filter: blur(8px);
}

.profile-modal {
  width: min(460px, calc(100vw - 40px));
  border: 1px solid rgba(255, 255, 255, .38);
  border-radius: 16px;
  background: #fafbf7;
  box-shadow: 0 30px 90px rgba(25, 38, 31, .24);
  overflow: hidden;
  position: relative;
}

.close-button {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 4;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, .28);
  border-radius: 50%;
  background: rgba(255, 255, 255, .10);
  color: #fff;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.profile-cover {
  height: 148px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(125deg, rgba(31, 68, 52, .92), rgba(112, 143, 128, .84)), #557064;
  color: #fff;
}

.profile-cover > span:first-child {
  font-size: 8px;
  letter-spacing: .16em;
  opacity: .72;
}

.profile-avatar {
  position: absolute;
  left: 50%;
  top: 48px;
  width: 82px;
  height: 82px;
  transform: translateX(-50%);
  display: grid;
  place-items: center;
  border: 5px solid #fafbf7;
  border-radius: 50%;
  background: #dde6df;
  color: #557064;
  font-family: Georgia, "Songti SC", serif;
  font-size: 28px;
  z-index: 2;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 50%;
  object-fit: cover;
}

.profile-content {
  padding: 48px 28px 24px;
  text-align: center;
}

.profile-content small {
  color: #9aa59f;
  font-size: 8px;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.profile-content h2 {
  margin: 7px 0 16px;
  color: #26382f;
  font-size: 27px;
}

.profile-content p {
  margin: 0 0 16px;
  color: #748278;
  font-size: 12px;
  line-height: 1.9;
}

.profile-content .profile-position {
  margin: 8px 0 14px;
  color: #557064;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.6;
}

.profile-focus {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 16px;
}

.profile-focus span {
  height: 28px;
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(49, 87, 68, .12);
  border-radius: 999px;
  background: #f1f4ef;
  color: #66776f;
  padding: 0 10px;
  font-size: 9px;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid rgba(32, 49, 41, .09);
  border-radius: 10px;
  margin-bottom: 18px;
  background: rgba(255, 255, 252, .72);
}

.profile-stats div {
  min-width: 0;
  min-height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-right: 1px solid rgba(32, 49, 41, .09);
  padding: 8px;
}

.profile-stats div:last-child { border-right: 0; }

.profile-stats strong {
  max-width: 100%;
  color: #365845;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-stats span {
  color: #9aa59f;
  font-size: 8px;
}

.profile-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid rgba(32, 49, 41, .09);
  color: #9aa59f;
  font-size: 8px;
  letter-spacing: .08em;
}

.modal-enter-active,
.modal-leave-active { transition: opacity .18s ease; }
.modal-enter-active .profile-modal,
.modal-leave-active .profile-modal { transition: transform .18s ease, opacity .18s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
.modal-enter-from .profile-modal,
.modal-leave-to .profile-modal { opacity: 0; transform: translateY(12px) scale(.98); }

@media (max-width: 980px) {
  .nav { margin-right: 18px; gap: 18px; }
  .hero { padding-inline: 28px; }
  .hero-visual { transform: scale(.86); }
  .market-strip { padding-inline: 28px; grid-template-columns: 140px 1fr; }
  .market-card { padding: 12px; }
  .content-grid { padding-inline: 28px; }
}

@media (max-width: 720px) {
  .site-shell { overflow-y: auto; }
  .header { height: 68px; padding: 0 18px; }
  .nav { display: none; }

  .hero {
    min-height: auto;
    grid-template-columns: 1fr;
    padding: 52px 18px 24px;
  }
  .hero h1 { font-size: clamp(52px, 16vw, 72px); }
  .hero-copy > p { font-size: 13px; }
  .hero-visual {
    height: 300px;
    margin-top: 10px;
    transform: scale(.72);
  }

  .market-strip {
    grid-template-columns: 1fr;
    padding: 18px;
  }
  .strip-label {
    border-right: 0;
    border-bottom: 1px solid rgba(22, 35, 29, .08);
    padding-bottom: 14px;
  }
  .market-grid { grid-template-columns: repeat(2, 1fr); }
  .market-card { min-height: 78px; border-bottom: 1px solid rgba(22, 35, 29, .08); }
  .market-card:nth-child(2) { border-right: 0; }

  .content-grid {
    grid-template-columns: 1fr;
    gap: 26px;
    padding: 44px 18px;
  }
  .team-panel { min-height: 250px; }

  .footer { height: 58px; padding-inline: 18px; }
  .footer span:last-child { display: none; }
}
</style>
