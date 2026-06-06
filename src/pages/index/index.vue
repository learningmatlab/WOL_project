<template>
  <view class="container">
    <view class="title">
      <text class="title-text">WOL Project</text>
    </view>
    <view class="content">
      <text class="desc">Vue3 + uni-app 空白项目已就绪</text>
    </view>
  </view>
</template>

<script setup lang="ts">
// 首页逻辑
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.title {
  margin-bottom: 40rpx;
}

.title-text {
  font-size: 48rpx;
  font-weight: bold;
  color: #333333;
}

.content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.desc {
  font-size: 28rpx;
  color: #999999;
}
</style>
