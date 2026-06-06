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
    <!-- 边缘彩虹线 -->
    <view class="card__edge" />

    <!-- 内容区 -->
    <view class="card__content">
      <view class="card-top">
        <view class="card-badge" :class="isOperating ? 'badge--on' : 'badge--off'">
          <view class="badge-dot" :class="isOperating ? 'dot--on' : 'dot--off'" />
          <text class="badge-text">{{ isOperating ? 'ACTIVE' : 'STANDBY' }}</text>
        </view>
        <text class="card-name">{{ device.name }}</text>
      </view>
      <view class="card-info">
        <view class="info-cell">
          <text class="info-key">MAC</text>
          <text class="info-val">{{ device.macAddress }}</text>
        </view>
        <view class="info-cell">
          <text class="info-key">ESP</text>
          <text class="info-val">{{ device.esp32Ip }}</text>
        </view>
      </view>
      <view v-if="statusText" class="card-status">
        <view class="status-bar" />
        <text class="status-msg">{{ statusText }}</text>
      </view>
      <view class="card-actions" @touchmove.stop>
        <button class="act-btn act-btn--wake" :disabled="isOperating" @tap.stop="$emit('wake', device)">
          <text class="act-icon">⏻</text>
          <text>{{ isOperating ? 'PROCESSING...' : '一键开机+解锁' }}</text>
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

  position: relative; border-radius: 28rpx; margin-bottom: 28rpx;
  overflow: hidden; transform-style: preserve-3d;
  backface-visibility: hidden;
  /* 更明亮的深色底 */
  background: #303060;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 10rpx 40rpx rgba(0, 0, 0, 0.35),
    0 0 0 1rpx rgba(255, 255, 255, 0.12),
    inset 0 0 80rpx rgba(255, 255, 255, 0.08);
  transform: perspective(1000rpx) rotateX(var(--ry)) rotateY(var(--rx));
  transition: transform 0.1s ease-out, box-shadow 0.3s;
  will-change: transform;
}

.card--active {
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 15rpx 50rpx rgba(0, 0, 0, 0.45), 0 0 0 1rpx rgba(255, 255, 255, 0.18), inset 0 0 100rpx rgba(255, 255, 255, 0.12);
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

/* ===== 光晕跟随层 ===== */
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
  padding: 32rpx;
  background: rgba(40, 40, 80, 0.2);
}

.card-top { display: flex; flex-direction: row; align-items: center; margin-bottom: 20rpx; }
.card-badge { display: flex; flex-direction: row; align-items: center; padding: 6rpx 16rpx; border-radius: 20rpx; margin-right: 16rpx; }
.badge--off { background: rgba(192, 132, 252, 0.25); }
.badge--on { background: rgba(255, 107, 157, 0.3); }
.badge-dot { width: 12rpx; height: 12rpx; border-radius: 50%; margin-right: 8rpx; }
.dot--off { background-color: #F0F0F0; }
.dot--on { background: linear-gradient(135deg, #FF6B9D, #C084FC); box-shadow: 0 0 14rpx rgba(192, 132, 252, 0.7); }
.badge-text { font-size: 18rpx; letter-spacing: 2rpx; font-family: 'SF Mono', 'Consolas', monospace; }
.badge--off .badge-text { color: #DDD0FF; }
.badge--on .badge-text { color: #FFA8C8; }
.card-name { flex: 1; font-size: 34rpx; font-weight: 700; color: #FFFFFF; }

.card-info {
  padding: 16rpx 20rpx;
  background: rgba(255, 255, 255, 0.15); border-radius: 14rpx;
  margin-bottom: 20rpx; border: 1rpx solid rgba(255, 255, 255, 0.2);
}
.info-cell { display: flex; flex-direction: row; align-items: center; padding: 5rpx 0; }
.info-key { font-size: 20rpx; color: #E0C8FF; width: 56rpx; letter-spacing: 1rpx; font-family: 'SF Mono', 'Consolas', monospace; }
.info-val { font-size: 22rpx; color: #FFFFFF; font-family: 'SF Mono', 'Consolas', monospace; letter-spacing: 1rpx; }

.card-status {
  display: flex; flex-direction: row; align-items: center;
  padding: 14rpx 20rpx; background: rgba(255, 107, 157, 0.2);
  border-radius: 14rpx; margin-bottom: 20rpx;
}
.status-bar { width: 6rpx; height: 28rpx; border-radius: 3rpx; background: linear-gradient(180deg, #FF6B9D, #C084FC); box-shadow: 0 0 14rpx rgba(192, 132, 252, 0.6); margin-right: 16rpx; }
.status-msg { font-size: 24rpx; color: #FFFFFF; letter-spacing: 1rpx; }

.card-actions { display: flex; flex-direction: column; gap: 12rpx; }
.act-row { display: flex; flex-direction: row; gap: 12rpx; }
.act-btn { flex: 1; height: 76rpx; display: flex; align-items: center; justify-content: center; border-radius: 14rpx; border: none; padding: 0; margin: 0; font-size: 26rpx; }
.act-btn::after { border: none; }
.act-icon { font-size: 30rpx; margin-right: 10rpx; }
.act-btn--wake { background: linear-gradient(135deg, #FF6B9D 0%, #C084FC 50%, #60A5FA 100%); color: #FFFFFF; font-weight: 600; box-shadow: 0 4rpx 20rpx rgba(192, 132, 252, 0.4); }
.act-btn--wake[disabled] { background: linear-gradient(135deg, #888 0%, #777 50%, #666 100%); color: rgba(255, 255, 255, 0.6); box-shadow: none; }
.act-btn--edit { background: rgba(192, 132, 252, 0.25); border: 1rpx solid rgba(192, 132, 252, 0.35); color: #E0C8FF; }
.act-btn--del { background: rgba(255, 107, 157, 0.25); border: 1rpx solid rgba(255, 107, 157, 0.35); color: #FFA8C8; }
</style>