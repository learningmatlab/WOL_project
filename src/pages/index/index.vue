<template>
  <view class="page">
    <view class="header">
      <view class="header-rainbow" />
      <text class="header-title">WOL</text>
      <text class="header-sub">远程唤醒 · 局域网控制</text>
      <view class="header-tags">
        <text class="tag tag--pink">LAN</text>
        <text class="tag tag--purple">UDP</text>
        <text class="tag tag--blue">ESP32</text>
      </view>
    </view>

    <view v-if="devices.length > 0" class="device-list">
      <DeviceCard
        v-for="device in devices"
        :key="device.id"
        :device="device"
        :is-active="operatingId === device.id"
        :is-operating="operatingId === device.id"
        :status-text="operatingId === device.id ? statusText : ''"
        :is-returning="animatingCardId === device.id"
        @wake="handleWake"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </view>

    <!-- 空状态全息卡片 -->
    <view v-else class="empty">
      <view
        class="ecard"
        :style="dynamicVars"
        @touchstart="onTouchStart"
        @touchmove.stop.prevent="onTouchMove"
        @touchend="onTouchEnd"
      >
        <view class="ecard__rainbow" />
        <view class="ecard__prism" />
        <view class="ecard__sparkle" />
        <view class="ecard__glare" />
        <view class="ecard__edge" />
        <view class="ecard__content">
          <text class="empty-icon">⬡</text>
          <text class="empty-title">NO DEVICE</text>
          <text class="empty-desc">还没有添加设备</text>
          <view class="empty-btn" @tap="handleAdd">
            <text class="empty-btn-text">+ 添加设备</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="devices.length > 0" class="fab" @tap="handleAdd">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import DeviceCard from '../../components/DeviceCard.vue'
import { getDevices, deleteDevice } from '../../utils/device-store'
import { wakeAndUnlock } from '../../utils/wol'
import type { Device } from '../../utils/device-store'

const devices = ref<Device[]>([])
const operatingId = ref('')
const statusText = ref('')
const animatingCardId = ref('') // 正在播放返回动画的卡片 ID

onMounted(() => { devices.value = getDevices() })
onShow(() => { 
  // 先加载数据，确保卡片已经显示
  devices.value = getDevices()
  
  // 如果有正在返回的卡片，播放返回动画
  if (animatingCardId.value) {
    const id = animatingCardId.value
    // 先清空
    animatingCardId.value = ''
    
    // 等 DOM 渲染完成（数据加载后卡片已显示），再触发返回动画
    setTimeout(() => {
      animatingCardId.value = id
      // 动画播放完成后清除状态
      setTimeout(() => {
        animatingCardId.value = ''
      }, 500)
    }, 50)
  }
})

function refreshList() { devices.value = getDevices() }

function handleFlipComplete() {
  // 翻转动画完成后的回调（可以添加音效等）
  console.log('卡片翻转完成')
}

const px = ref(50)
const py = ref(50)
const touching = ref(false)

const fromCenter = computed(() => Math.min(1, Math.sqrt((py.value - 50) ** 2 + (px.value - 50) ** 2) / 50))
const fromTop = computed(() => py.value / 100)
const fromLeft = computed(() => px.value / 100)
const rotX = computed(() => ((px.value - 50) / 50) * 18)
const rotY = computed(() => (-(py.value - 50) / 50) * 18)

const dynamicVars = computed(() => {
  const o = touching.value ? 1 : 0.6
  return `--px:${px.value}%;--py:${py.value}%;--fc:${fromCenter.value};--ft:${fromTop.value};--fl:${fromLeft.value};--co:${o};--rx:${rotX.value}deg;--ry:${rotY.value}deg;`
})

function onTouchStart() { touching.value = true }
function onTouchMove(e: any) {
  if (!e.touches?.[0]) return
  const query = uni.createSelectorQuery()
  query.select('.ecard').boundingClientRect()
  query.exec((res: any) => {
    if (!res?.[0]) return
    const rect = res[0]
    px.value = Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100))
    py.value = Math.max(0, Math.min(100, ((e.touches[0].clientY - rect.top) / rect.height) * 100))
  })
}
function onTouchEnd() { touching.value = false; px.value = 50; py.value = 50 }

async function handleWake(device: Device) {
  operatingId.value = device.id; statusText.value = '正在发送开机信号...'
  uni.showLoading({ title: '正在开机...', mask: true })
  const result = await wakeAndUnlock(device, (status: string) => {
    statusText.value = status; uni.hideLoading(); uni.showLoading({ title: status, mask: true })
  })
  uni.hideLoading(); operatingId.value = ''; statusText.value = ''
  if (result.success) { uni.showToast({ title: result.message, icon: 'success', duration: 3000 }) }
  else { uni.showModal({ title: '操作失败', content: result.message, showCancel: false }) }
}
function handleEdit(device: Device) { 
  // 记录正在编辑的卡片
  animatingCardId.value = device.id
  
  uni.navigateTo({ url: `/pages/add-device/add-device?id=${device.id}` }) 
}
function handleDelete(device: Device) { deleteDevice(device.id); refreshList(); uni.showToast({ title: '已删除', icon: 'success' }) }
function handleAdd() { uni.navigateTo({ url: '/pages/add-device/add-device' }) }
</script>

<style scoped>
.page { min-height: 100vh; background-color: #FFF8F0; }

.header { position: relative; padding: 56rpx 40rpx 36rpx; overflow: hidden; }
.header-rainbow {
  position: absolute; top: 0; left: 0; right: 0; height: 8rpx;
  background: linear-gradient(90deg, #FF6B9D, #C084FC, #60A5FA, #22D3EE, #34D399, #FBBF24, #FF6B9D);
  background-size: 200% 100%; animation: rainbowSlide 4s linear infinite;
}
@keyframes rainbowSlide { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
.header-title { font-size: 56rpx; font-weight: 800; color: #1E1B4B; letter-spacing: 6rpx; }
.header-sub { font-size: 24rpx; color: #7C3AED; margin-top: 8rpx; }
.header-tags { display: flex; flex-direction: row; gap: 12rpx; margin-top: 20rpx; }
.tag { font-size: 20rpx; padding: 6rpx 16rpx; border-radius: 20rpx; letter-spacing: 1rpx; font-weight: 600; }
.tag--pink { background: rgba(255, 107, 157, 0.12); color: #FF6B9D; }
.tag--purple { background: rgba(192, 132, 252, 0.12); color: #C084FC; }
.tag--blue { background: rgba(96, 165, 250, 0.12); color: #60A5FA; }

.device-list { padding: 8rpx 32rpx 200rpx; }

/* ===== 空状态全息卡片 ===== */
.empty { display: flex; align-items: center; justify-content: center; padding: 40rpx; }
.ecard {
  --px: 50%; --py: 50%; --fc: 0; --ft: 0.5; --fl: 0.5; --co: 0.6;
  --rx: 0deg; --ry: 0deg;

  position: relative; width: 100%; border-radius: 28rpx;
  background: linear-gradient(145deg,
    #e8d5ff 0%, #d4b8ff 15%, #c4e0ff 30%,
    #a8f0e0 50%, #ffe0b8 70%, #ffb8d4 85%, #e8d5ff 100%);
  border: 2rpx solid rgba(192, 132, 252, 0.25);
  box-shadow: 0 8rpx 40rpx rgba(192, 132, 252, 0.15), 0 0 80rpx rgba(96, 165, 250, 0.08);
  overflow: hidden; transform-style: preserve-3d;
  transform: perspective(800rpx) rotateX(var(--ry)) rotateY(var(--rx));
  transition: transform 0.18s ease-out;
  will-change: transform;
}

.ecard__rainbow {
  position: absolute; inset: 0; pointer-events: none; border-radius: 28rpx;
  opacity: var(--co); mix-blend-mode: multiply;
  background-image:
    repeating-linear-gradient(
      100deg,
      hsl(350, 90%, 75%) 0%, hsl(20, 95%, 70%) 5%,
      hsl(50, 95%, 68%) 10%, hsl(90, 85%, 65%) 15%,
      hsl(160, 90%, 70%) 20%, hsl(195, 95%, 72%) 25%,
      hsl(230, 90%, 75%) 30%, hsl(270, 85%, 72%) 35%,
      hsl(310, 90%, 73%) 40%, hsl(350, 90%, 75%) 45%,
      hsl(20, 95%, 70%) 50%, hsl(50, 95%, 68%) 55%,
      hsl(90, 85%, 65%) 60%, hsl(160, 90%, 70%) 65%,
      hsl(195, 95%, 72%) 70%, hsl(230, 90%, 75%) 75%,
      hsl(270, 85%, 72%) 80%, hsl(310, 90%, 73%) 85%,
      hsl(350, 90%, 75%) 90%, hsl(20, 95%, 70%) 95%,
      hsl(50, 95%, 68%) 100%
    ),
    radial-gradient(
      farthest-corner circle at var(--px) var(--py),
      rgba(255, 255, 255, 0.85) 0%,
      rgba(200, 180, 255, 0.4) 30%,
      rgba(0, 0, 30, 0.15) 100%
    );
  background-blend-mode: overlay;
  background-size: 500% 500%, 100% 100%;
  background-position:
    calc(10% + var(--fl) * 80%) calc(10% + var(--ft) * 80%),
    center center;
  filter: brightness(1.15) contrast(1.6) saturate(2);
  transition: opacity 0.25s ease;
}

.ecard__prism {
  position: absolute; inset: 0; pointer-events: none; border-radius: 28rpx;
  opacity: calc(var(--co) * 0.6); mix-blend-mode: overlay;
  background-image:
    conic-gradient(
      from 45deg at var(--px) var(--py),
      hsl(350, 100%, 78%), hsl(30, 100%, 72%), hsl(60, 100%, 70%),
      hsl(120, 90%, 68%), hsl(180, 95%, 72%), hsl(220, 100%, 76%),
      hsl(280, 95%, 74%), hsl(330, 100%, 76%), hsl(350, 100%, 78%)
    );
  background-size: 250% 250%;
  background-position: calc(25% + var(--fl) * 50%) calc(25% + var(--ft) * 50%);
  filter: brightness(0.7) contrast(2) saturate(2.2);
  transition: opacity 0.25s ease;
}

.ecard__sparkle {
  position: absolute; inset: 0; pointer-events: none; border-radius: 28rpx;
  opacity: calc(0.2 + var(--fc) * 0.5); mix-blend-mode: overlay;
  background-image:
    radial-gradient(1.5rpx 1.5rpx at 15% 25%, rgba(255,255,255,1) 50%, transparent 100%),
    radial-gradient(1.5rpx 1.5rpx at 70% 12%, rgba(255,255,255,1) 50%, transparent 100%),
    radial-gradient(1rpx 1rpx at 50% 65%, rgba(255,255,255,0.9) 50%, transparent 100%),
    radial-gradient(1.5rpx 1.5rpx at 85% 50%, rgba(255,255,255,1) 50%, transparent 100%),
    radial-gradient(1rpx 1rpx at 25% 82%, rgba(255,255,255,0.9) 50%, transparent 100%),
    radial-gradient(1.5rpx 1.5rpx at 60% 38%, rgba(255,255,255,1) 50%, transparent 100%),
    radial-gradient(1rpx 1rpx at 8% 58%, rgba(255,255,255,0.8) 50%, transparent 100%),
    radial-gradient(1.5rpx 1.5rpx at 92% 78%, rgba(255,255,255,1) 50%, transparent 100%),
    radial-gradient(1rpx 1rpx at 40% 15%, rgba(255,255,255,0.9) 50%, transparent 100%),
    radial-gradient(1.5rpx 1.5rpx at 75% 92%, rgba(255,255,255,1) 50%, transparent 100%);
  background-size: 100% 100%; background-repeat: no-repeat;
  filter: brightness(2) contrast(2.5);
  transition: opacity 0.25s ease;
}

.ecard__glare {
  position: absolute; inset: 0; pointer-events: none; border-radius: 28rpx;
  opacity: calc(var(--co) * 0.7); mix-blend-mode: overlay;
  background-image:
    radial-gradient(farthest-corner circle at var(--px) var(--py),
      hsla(220, 100%, 95%, 0.9) 0%, hsla(280, 80%, 90%, 0.4) 20%, hsla(0, 0%, 40%, 0.1) 60%, transparent 100%);
  filter: brightness(0.8) contrast(1.8) saturate(1.5);
  transition: opacity 0.25s ease;
}

.ecard__edge {
  position: absolute; inset: -2rpx; pointer-events: none; border-radius: 30rpx;
  background: linear-gradient(135deg, #FF6B9D, #FBBF24, #34D399, #22D3EE, #60A5FA, #C084FC, #FF6B9D);
  background-size: 300% 300%; z-index: 0; opacity: 0.4;
  animation: edgeFlow 5s linear infinite;
}
@keyframes edgeFlow { 0% { background-position: 0% 50%; } 100% { background-position: 300% 50%; } }

.ecard__content { position: relative; z-index: 2; padding: 72rpx 40rpx; display: flex; flex-direction: column; align-items: center; }
.empty-icon { font-size: 80rpx; color: #C084FC; margin-bottom: 24rpx; }
.empty-title { font-size: 32rpx; color: #1E1B4B; font-weight: 700; letter-spacing: 4rpx; }
.empty-desc { font-size: 24rpx; color: #7C3AED; margin-top: 12rpx; margin-bottom: 40rpx; }
.empty-btn { padding: 20rpx 56rpx; border-radius: 14rpx; background: linear-gradient(135deg, #FF6B9D 0%, #C084FC 50%, #60A5FA 100%); box-shadow: 0 6rpx 24rpx rgba(192, 132, 252, 0.35); }
.empty-btn-text { font-size: 28rpx; color: #FFFFFF; font-weight: 600; letter-spacing: 2rpx; }

.fab {
  position: fixed; right: 48rpx; bottom: 80rpx; width: 112rpx; height: 112rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #C084FC 50%, #60A5FA 100%);
  border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 10;
  box-shadow: 0 8rpx 28rpx rgba(192, 132, 252, 0.4);
}
.fab-icon { font-size: 48rpx; color: #FFFFFF; font-weight: 300; line-height: 1; }
</style>