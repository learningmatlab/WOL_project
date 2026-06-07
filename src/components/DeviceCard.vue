<template>
  <view
    class="card"
    :class="{ 
      'card--active': isOperating, 
      'card--editing': isEditing,
      'card--returning': isReturning 
    }"
    :style="dynamicVars"
    @touchstart="onTouchStart"
    @touchmove.stop.prevent="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- 彩虹条纹全息层 -->
    <view class="card__rainbow" />
    <!-- 银河星空粒子层 -->
    <view class="card__galaxy" />
    <!-- 旋转棱镜全息层 -->
    <view class="card__prism" />
    <!-- 闪光粒子层 -->
    <view class="card__sparkle" />
    <!-- 光晕跟随层 -->
    <view class="card__glare" />
    <!-- 光影追踪层（径向渐变） -->
    <view class="card__lighttrack" :style="lightTrackStyle" />
    <!-- 边缘彩虹线 -->
    <view class="card__edge" />

    <!-- 内容区 -->
    <view class="card__content">
      <view class="card-top">
        <view class="card-badge" :class="badgeClass">
          <view class="badge-dot" :class="dotClass" />
          <text class="badge-text">{{ statusText }}</text>
        </view>
        <text class="card-name">{{ device.name }}</text>
      </view>
      <view class="card-info">
        <view class="info-capsule">
          <text class="info-icon">📡</text>
          <text class="info-label">MAC</text>
          <text class="info-value">{{ device.macAddress }}</text>
        </view>
        <view class="info-capsule">
          <text class="info-icon">🔧</text>
          <text class="info-label">ESP</text>
          <text class="info-value">{{ device.esp32Ip }}</text>
        </view>
      </view>
      <view v-if="statusText" class="card-status">
        <view class="status-bar" />
        <text class="status-msg">{{ statusText }}</text>
      </view>
      <view class="card-actions" @touchmove.stop>
        <button 
          class="act-btn act-btn--wake" 
          :class="{ 'act-btn--active': isWakeActive, 'act-btn--processing': isOperating }"
          :disabled="isOperating" 
          @tap.stop="handleWakeClick"
        >
          <view class="btn-shine" />
          <view class="btn-progress" :style="{ width: wakeProgress + '%' }" />
          <text class="act-icon">⏻</text>
          <text class="btn-text">{{ isOperating ? 'PROCESSING...' : '一键开机+解锁' }}</text>
        </button>
        <view class="act-row">
          <button class="act-btn act-btn--edit" @tap.stop="handleEdit">编辑</button>
          <button class="act-btn act-btn--del" @tap.stop="handleDelete">删除</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Device } from '../utils/device-store'

const props = defineProps<{
  device: Device
  isActive: boolean
  isOperating: boolean
  statusText: string
  isReturning: boolean // 返回动画状态
}>()

const emit = defineEmits<{
  wake: [device: Device]
  edit: [device: Device]
  delete: [device: Device]
}>()

const px = ref(50)
const py = ref(50)
const touching = ref(false)
const isEditing = ref(false) // 编辑动画状态
const isWakeActive = ref(false) // 按钮点击激活状态
const wakeProgress = ref(0) // 按钮进度条

const fromCenter = computed(() => Math.min(1, Math.sqrt((py.value - 50) ** 2 + (px.value - 50) ** 2) / 50))
const fromTop = computed(() => py.value / 100)
const fromLeft = computed(() => px.value / 100)
const rotX = computed(() => ((px.value - 50) / 50) * 18)
const rotY = computed(() => (-(py.value - 50) / 50) * 18)

const dynamicVars = computed(() => {
  const o = touching.value ? 1 : 0.6
  return `
    --px:${px.value}%;
    --py:${py.value}%;
    --fc:${fromCenter.value};
    --ft:${fromTop.value};
    --fl:${fromLeft.value};
    --co:${o};
    --rx:${rotX.value}deg;
    --ry:${rotY.value}deg;
  `
})

// 光影追踪样式
const lightTrackStyle = computed(() => {
  return {
    '--lx': `${px.value}%`,
    '--ly': `${py.value}%`,
    '--lo': touching.value ? 0.4 : 0.15
  }
})

// 状态标签样式（环境感知）
const badgeClass = computed(() => {
  if (props.isOperating) return 'badge--waking'
  if (props.statusText.includes('成功') || props.statusText.includes('完成')) return 'badge--online'
  return 'badge--standby'
})

const dotClass = computed(() => {
  if (props.isOperating) return 'dot--waking'
  if (props.statusText.includes('成功') || props.statusText.includes('完成')) return 'dot--online'
  return 'dot--standby'
})

function onTouchStart() { touching.value = true }
function onTouchMove(e: any) {
  if (!e.touches?.[0]) return
  const query = uni.createSelectorQuery()
  query.select('.card').boundingClientRect()
  query.exec((res: any) => {
    if (!res?.[0]) return
    const rect = res[0]
    const touch = e.touches[0]
    const x = touch.clientX || touch.pageX || touch.x
    const y = touch.clientY || touch.pageY || touch.y
    px.value = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100))
    py.value = Math.max(0, Math.min(100, ((y - rect.top) / rect.height) * 100))
  })
}
function onTouchEnd() { touching.value = false; px.value = 50; py.value = 50 }

function handleEdit() {
  // 如果已经在编辑中，忽略
  if (isEditing.value) return
  
  // 启动编辑动画
  isEditing.value = true
  
  // 等待动画完成后触发跳转
  setTimeout(() => {
    emit('edit', props.device)
    
    // 跳转后立即重置状态
    setTimeout(() => {
      isEditing.value = false
    }, 100)
  }, 600)
}

function handleDelete() {
  uni.showModal({
    title: '确认删除', content: `确定要删除「${props.device.name}」吗？`,
    success(res) { if (res.confirm) emit('delete', props.device) },
  })
}

function handleWakeClick() {
  if (props.isOperating) return
  
  // 激活按钮点击状态
  isWakeActive.value = true
  wakeProgress.value = 0
  
  // 模拟进度条动画
  const interval = setInterval(() => {
    wakeProgress.value += 10
    if (wakeProgress.value >= 100) {
      clearInterval(interval)
      setTimeout(() => {
        isWakeActive.value = false
        wakeProgress.value = 0
      }, 300)
    }
  }, 100)
  
  // 触发唤醒事件
  emit('wake', props.device)
}
</script>

<style scoped>
/* ===== 卡片容器 ===== */
.card {
  --px: 50%;
  --py: 50%;
  --fc: 0;
  --ft: 0.5;
  --fl: 0.5;
  --co: 0;
  --rx: 0deg;
  --ry: 0deg;

  position: relative; 
  border-radius: 32rpx; 
  margin-bottom: 32rpx;
  overflow: hidden; 
  transform-style: preserve-3d;
  backface-visibility: hidden;
  
  /* 玻璃拟态升级：半透明 + 强模糊 */
  background: linear-gradient(135deg, rgba(48, 48, 96, 0.65), rgba(32, 32, 64, 0.75));
  backdrop-filter: blur(30rpx) saturate(150%);
  -webkit-backdrop-filter: blur(30rpx) saturate(150%);
  
  /* 边缘光：1px 半透明渐变边框 */
  border: 1.5rpx solid rgba(255, 255, 255, 0.18);
  
  /* 多层阴影：内阴影 + 外阴影 */
  box-shadow:
    /* 左上角内阴影（高光） */
    inset 2rpx 2rpx 4rpx rgba(255, 255, 255, 0.15),
    inset -2rpx -2rpx 4rpx rgba(0, 0, 0, 0.2),
    /* 外阴影（浮动效果） */
    0 8rpx 32rpx rgba(0, 0, 0, 0.4),
    0 16rpx 48rpx rgba(0, 0, 0, 0.25),
    0 0 0 1rpx rgba(255, 255, 255, 0.08);
  
  transform: perspective(1000rpx) rotateX(var(--ry)) rotateY(var(--rx));
  transition: transform 0.15s ease-out, box-shadow 0.3s ease;
  will-change: transform;
}

.card--active {
  border-color: rgba(255, 255, 255, 0.28);
  box-shadow: 
    inset 2rpx 2rpx 4rpx rgba(255, 255, 255, 0.2),
    inset -2rpx -2rpx 4rpx rgba(0, 0, 0, 0.25),
    0 12rpx 40rpx rgba(0, 0, 0, 0.5),
    0 20rpx 60rpx rgba(0, 0, 0, 0.35),
    0 0 0 1rpx rgba(255, 255, 255, 0.12);
  transform: perspective(1000rpx) rotateX(var(--ry)) rotateY(var(--rx)) scale(1.02);
}

/* 点击编辑时的翻转放大过渡动画 */
.card--editing {
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform: perspective(1000rpx) rotateY(180deg) scale3d(1.2, 1.2, 1.2);
  opacity: 0;
  pointer-events: none;
  will-change: transform, opacity;
  transform-origin: center center;
}

/* 从编辑页面返回的翻转动画 */
.card--returning {
  animation: cardReturn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  will-change: transform, opacity;
  transform-origin: center center;
}

@keyframes cardReturn {
  0% {
    transform: perspective(1000rpx) rotateY(-180deg) scale3d(1.2, 1.2, 1.2);
    opacity: 0;
  }
  30% {
    opacity: 0.3;
  }
  100% {
    transform: perspective(1000rpx) rotateY(0deg) scale3d(1, 1, 1);
    opacity: 1;
  }
}

/* ===== 彩虹条纹全息层 ===== */
.card__rainbow {
  position: absolute; inset: 0;
  pointer-events: none; border-radius: 28rpx;
  opacity: var(--co);
  mix-blend-mode: color-dodge;

  /* 固定渐变，不移动，用 filter hue-rotate 实现颜色流动 */
  background-image:
    linear-gradient(135deg, 
      hsl(0, 100%, 50%), 
      hsl(60, 100%, 50%), 
      hsl(120, 100%, 50%), 
      hsl(180, 100%, 50%), 
      hsl(240, 100%, 50%), 
      hsl(300, 100%, 50%), 
      hsl(360, 100%, 50%));
  
  background-size: 100% 100%;
  background-position: center;
  
  /* 用 hue-rotate 实现颜色流动，没有接缝 */
  filter: hue-rotate(calc(var(--fc) * 60deg)) brightness(1) contrast(1) saturate(1);
  transition: opacity 0.3s ease;
}

/* ===== 银河星空粒子层 ===== */
.card__galaxy {
  position: absolute; inset: 0;
  pointer-events: none; border-radius: 28rpx;
  opacity: var(--co);
  mix-blend-mode: color-dodge;

  background-image:
    radial-gradient(1.5rpx 1.5rpx at 10% 15%, white 100%, transparent),
    radial-gradient(1.5rpx 1.5rpx at 20% 35%, white 100%, transparent),
    radial-gradient(1rpx 1rpx at 30% 20%, white 100%, transparent),
    radial-gradient(1.5rpx 1.5rpx at 40% 45%, white 100%, transparent),
    radial-gradient(1rpx 1rpx at 50% 25%, white 100%, transparent),
    radial-gradient(1.5rpx 1.5rpx at 60% 50%, white 100%, transparent),
    radial-gradient(1rpx 1rpx at 70% 30%, white 100%, transparent),
    radial-gradient(1.5rpx 1.5rpx at 80% 55%, white 100%, transparent),
    radial-gradient(1rpx 1rpx at 90% 35%, white 100%, transparent),
    radial-gradient(1.5rpx 1.5rpx at 15% 60%, white 100%, transparent),
    radial-gradient(1rpx 1rpx at 25% 70%, white 100%, transparent),
    radial-gradient(1.5rpx 1.5rpx at 35% 80%, white 100%, transparent),
    radial-gradient(1rpx 1rpx at 45% 65%, white 100%, transparent),
    radial-gradient(1.5rpx 1.5rpx at 55% 85%, white 100%, transparent),
    radial-gradient(1rpx 1rpx at 65% 75%, white 100%, transparent),
    radial-gradient(1.5rpx 1.5rpx at 75% 90%, white 100%, transparent),
    radial-gradient(1rpx 1rpx at 85% 80%, white 100%, transparent),
    radial-gradient(1.5rpx 1.5rpx at 95% 95%, white 100%, transparent);

  background-size: 100% 100%;
  filter: brightness(1.2);
  transition: opacity 0.3s ease;
}

/* ===== 旋转棱镜全息层 ===== */
.card__prism {
  position: absolute; inset: 0;
  pointer-events: none; border-radius: 28rpx;
  opacity: calc(var(--co) * 0.5);
  mix-blend-mode: color-dodge;

  /* 锥形渐变固定不动，用 hue-rotate 实现旋转效果 */
  background-image:
    conic-gradient(
      from 0deg at 50% 50%,
      hsl(0, 100%, 50%),
      hsl(60, 100%, 50%),
      hsl(120, 100%, 50%),
      hsl(180, 100%, 50%),
      hsl(240, 100%, 50%),
      hsl(300, 100%, 50%),
      hsl(360, 100%, 50%)
    );
  
  background-size: 100% 100%;
  background-position: center;
  
  /* 用 hue-rotate 模拟旋转，没有移动就没有接缝 */
  filter: hue-rotate(calc(var(--fc) * 120deg)) brightness(0.8) contrast(1.2) saturate(1);
  transition: opacity 0.3s ease;
}

/* ===== 闪光粒子层 ===== */
.card__sparkle {
  position: absolute; inset: 0;
  pointer-events: none; border-radius: 28rpx;
  opacity: var(--co);
  mix-blend-mode: color-dodge;

  background-image:
    radial-gradient(circle at 20% 30%, white 0%, transparent 2%),
    radial-gradient(circle at 40% 70%, white 0%, transparent 2%),
    radial-gradient(circle at 60% 40%, white 0%, transparent 2%),
    radial-gradient(circle at 80% 60%, white 0%, transparent 2%),
    radial-gradient(circle at 30% 80%, white 0%, transparent 2%),
    radial-gradient(circle at 70% 20%, white 0%, transparent 2%);

  background-size: 100% 100%;
  filter: brightness(1.5);
  transition: opacity 0.3s ease;
}

/* 光晕跟随层 */
.card__glare {
  position: absolute; inset: 0;
  pointer-events: none; border-radius: 28rpx;
  opacity: var(--co);
  mix-blend-mode: overlay;

  background-image:
    radial-gradient(
      farthest-corner circle at var(--px) var(--py),
      rgba(255, 255, 255, 0.8) 0%,
      rgba(255, 255, 255, 0.5) 10%,
      rgba(255, 255, 255, 0.2) 20%,
      rgba(255, 255, 255, 0.05) 50%,
      transparent 80%
    );

  filter: brightness(1) contrast(1) saturate(1);
  transition: opacity 0.3s ease;
}

/* 光影追踪层（径向渐变） */
.card__lighttrack {
  position: absolute; inset: 0;
  pointer-events: none; border-radius: 28rpx;
  opacity: var(--lo);
  mix-blend-mode: overlay;
  transition: opacity 0.3s ease;

  background-image:
    radial-gradient(
      circle at var(--lx) var(--ly),
      rgba(255, 255, 255, 0.25) 0%,
      rgba(255, 255, 255, 0.1) 15%,
      transparent 50%
    );
}

/* ===== 边缘彩虹线 ===== */
.card__edge {
  position: absolute; inset: -2rpx;
  pointer-events: none; border-radius: 30rpx;
  background: linear-gradient(135deg,
    #FF6B9D, #FBBF24, #34D399, #22D3EE, #60A5FA, #C084FC, #FF6B9D);
  background-size: 100% 100%;
  z-index: 0; opacity: 0.4;
  /* 用 hue-rotate 实现颜色流动，无接缝 */
  animation: edgeHueRotate 5s linear infinite;
}
@keyframes edgeHueRotate { 
  0% { filter: hue-rotate(0deg); } 
  100% { filter: hue-rotate(360deg); } 
}
.card--active .card__edge { opacity: 0.7; }

/* ===== 内容区 ===== */
.card__content { 
  position: relative; 
  z-index: 2; 
  padding: 40rpx 36rpx;
  background: transparent;
}

.card-top { 
  display: flex; 
  flex-direction: row; 
  align-items: center; 
  margin-bottom: 28rpx;
}

.card-badge { 
  display: flex; 
  flex-direction: row; 
  align-items: center; 
  padding: 8rpx 18rpx; 
  border-radius: 24rpx; 
  margin-right: 18rpx; 
  border: 1rpx solid;
  backdrop-filter: blur(8rpx);
  -webkit-backdrop-filter: blur(8rpx);
}

/* STANDBY - 灰色 */
.badge--standby { 
  background: rgba(128, 128, 128, 0.15); 
  border-color: rgba(128, 128, 128, 0.3); 
}
.badge--standby .badge-text { color: #B0B0B0; }
.badge--standby .dot--standby { background-color: #A0A0A0; }

/* WAKING - 亮橙色呼吸灯 */
.badge--waking { 
  background: rgba(255, 165, 0, 0.2); 
  border-color: rgba(255, 165, 0, 0.4);
  animation: badgePulse 2s ease-in-out infinite;
}
.badge--waking .badge-text { color: #FFB84D; }
.dot--waking { 
  background: #FFA500; 
  box-shadow: 0 0 14rpx rgba(255, 165, 0, 0.8);
  animation: dotPulse 2s ease-in-out infinite;
}

/* ONLINE - 荧光绿 */
.badge--online { 
  background: rgba(0, 255, 136, 0.15); 
  border-color: rgba(0, 255, 136, 0.3);
  box-shadow: 0 0 20rpx rgba(0, 255, 136, 0.2);
}
.badge--online .badge-text { color: #00FF88; }
.dot--online { 
  background: #00FF88; 
  box-shadow: 0 0 14rpx rgba(0, 255, 136, 0.9);
}

/* 呼吸灯动画 */
@keyframes badgePulse {
  0%, 100% { 
    background: rgba(255, 165, 0, 0.2); 
    border-color: rgba(255, 165, 0, 0.4);
  }
  50% { 
    background: rgba(255, 165, 0, 0.35); 
    border-color: rgba(255, 165, 0, 0.6);
  }
}

@keyframes dotPulse {
  0%, 100% { 
    box-shadow: 0 0 14rpx rgba(255, 165, 0, 0.8);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 24rpx rgba(255, 165, 0, 1);
    transform: scale(1.2);
  }
}

.badge-dot { width: 12rpx; height: 12rpx; border-radius: 50%; margin-right: 8rpx; transition: all 0.3s ease; }
.badge-text { font-size: 18rpx; letter-spacing: 2rpx; font-family: 'SF Mono', 'Consolas', monospace; font-weight: 600; }
.card-name { flex: 1; font-size: 34rpx; font-weight: 700; color: #FFFFFF; text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3); }

/* 胶囊状信息槽位 */
.card-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.info-capsule {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 14rpx 20rpx;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8rpx);
  -webkit-backdrop-filter: blur(8rpx);
  transition: all 0.2s ease;
}

.info-capsule:active {
  background: rgba(0, 0, 0, 0.35);
  transform: scale(0.98);
}

.info-icon { 
  font-size: 24rpx; 
  margin-right: 10rpx; 
  opacity: 0.85;
  filter: saturate(0.8);
}

.info-label { 
  font-size: 20rpx; 
  color: #A090C0; 
  min-width: 64rpx;
  letter-spacing: 2rpx; 
  font-family: 'SF Mono', 'Consolas', monospace; 
  opacity: 0.6;
  font-weight: 500;
}

.info-value { 
  flex: 1;
  font-size: 22rpx; 
  color: #FFFFFF; 
  font-family: 'Courier New', 'SF Mono', 'Consolas', monospace; 
  letter-spacing: 1.5rpx; 
  font-weight: 600;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
}

.card-status {
  display: flex; 
  flex-direction: row; 
  align-items: center;
  padding: 16rpx 24rpx; 
  background: rgba(255, 107, 157, 0.15);
  border-radius: 16rpx; 
  margin-bottom: 24rpx;
  border: 1rpx solid rgba(255, 107, 157, 0.2);
  backdrop-filter: blur(8rpx);
  -webkit-backdrop-filter: blur(8rpx);
}
.status-bar { 
  width: 6rpx; 
  height: 32rpx; 
  border-radius: 3rpx; 
  background: linear-gradient(180deg, #FF6B9D, #C084FC); 
  box-shadow: 0 0 16rpx rgba(192, 132, 252, 0.7); 
  margin-right: 18rpx;
}
.status-msg { 
  font-size: 24rpx; 
  color: #FFFFFF; 
  letter-spacing: 1rpx;
  font-weight: 500;
}

.card-actions { display: flex; flex-direction: column; gap: 12rpx; }
.act-row { display: flex; flex-direction: row; gap: 12rpx; }
.act-btn { 
  flex: 1; 
  height: 76rpx; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  border-radius: 14rpx; 
  border: none; 
  padding: 0; 
  margin: 0; 
  font-size: 26rpx;
  position: relative;
  overflow: hidden;
  transition: transform 0.1s ease;
}
.act-btn:active {
  transform: scale(0.96);
}
.act-btn::after { border: none; }
.act-icon { font-size: 30rpx; margin-right: 10rpx; }

/* 进度条 */
.btn-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.3));
  transition: width 0.1s linear;
  pointer-events: none;
  z-index: 1;
}

/* 流光特效 */
.btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  pointer-events: none;
  z-index: 2;
}

.act-btn--active .btn-shine {
  animation: shineSlide 1s ease-in-out;
}

@keyframes shineSlide {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.act-btn--wake { 
  background: linear-gradient(135deg, #FF6B9D 0%, #C084FC 50%, #60A5FA 100%); 
  color: #FFFFFF; 
  font-weight: 600; 
  box-shadow: 0 4rpx 20rpx rgba(192, 132, 252, 0.4);
  position: relative;
  overflow: hidden;
}

.act-btn--wake::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.act-btn--wake:active:not([disabled])::before {
  transform: translateX(100%);
}

.act-btn--wake[disabled] { 
  background: linear-gradient(135deg, #888 0%, #777 50%, #666 100%); 
  color: rgba(255, 255, 255, 0.6); 
  box-shadow: none;
}

.act-btn--processing {
  animation: btnPulse 1.5s ease-in-out infinite;
}

@keyframes btnPulse {
  0%, 100% {
    box-shadow: 0 4rpx 20rpx rgba(192, 132, 252, 0.4);
  }
  50% {
    box-shadow: 0 4rpx 30rpx rgba(192, 132, 252, 0.7);
  }
}
.act-btn--edit { 
  background: rgba(192, 132, 252, 0.25); 
  border: 1rpx solid rgba(192, 132, 252, 0.35); 
  color: #E0C8FF;
}
.act-btn--edit:active {
  background: rgba(192, 132, 252, 0.35);
}
.act-btn--del { 
  background: rgba(255, 107, 157, 0.25); 
  border: 1rpx solid rgba(255, 107, 157, 0.35); 
  color: #FFA8C8;
}
.act-btn--del:active {
  background: rgba(255, 107, 157, 0.35);
}
</style>