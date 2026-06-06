<template>
  <view class="page">
    <view class="section">
      <view class="section-line"><text class="section-tag">设备信息</text></view>
      <view class="form-card">
        <view class="field">
          <text class="field-label">设备名称</text>
          <view class="field-input-box">
            <input v-model="form.name" class="field-input" placeholder="如：我的台式机" placeholder-class="ph" />
          </view>
        </view>
        <view class="field">
          <text class="field-label">MAC 地址</text>
          <view class="field-input-box">
            <input v-model="form.macAddress" class="field-input mono" placeholder="A1:B2:C3:D4:E5:F6" placeholder-class="ph" />
          </view>
          <text class="field-hint">目标主机网卡物理地址</text>
        </view>
      </view>
    </view>
    <view class="section">
      <view class="section-line"><text class="section-tag">网络配置</text></view>
      <view class="form-card">
        <view class="field">
          <text class="field-label">ESP32 IP</text>
          <view class="field-input-box">
            <input v-model="form.esp32Ip" class="field-input mono" placeholder="192.168.1.125" placeholder-class="ph" />
          </view>
          <text class="field-hint">ESP32-S3 局域网固定地址</text>
        </view>
        <view class="field">
          <text class="field-label">安全暗号</text>
          <view class="field-input-box">
            <input v-model="form.token" class="field-input mono" placeholder="与 ESP32 约定的暗号" placeholder-class="ph" />
          </view>
          <text class="field-hint">局域网验证令牌</text>
        </view>
      </view>
    </view>
    <view class="section">
      <view class="section-line"><text class="section-tag">解锁配置</text></view>
      <view class="form-card">
        <view class="field last">
          <text class="field-label">Windows 密码</text>
          <view class="field-input-box">
            <input v-model="form.windowsPassword" class="field-input" type="safe-password" placeholder="锁屏密码" placeholder-class="ph" />
          </view>
          <text class="field-hint">ESP32 自动解锁凭证</text>
        </view>
      </view>
    </view>
    <view class="submit-wrap">
      <button class="submit-btn" :disabled="!isFormValid" @tap="handleSave">
        {{ isEdit ? '保存修改' : '添加设备' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { addDevice, getDeviceById, updateDevice } from '../../utils/device-store'

const form = ref({ name: '', macAddress: '', esp32Ip: '', token: 'my_secret_666', windowsPassword: '' })
const editId = ref('')
const isEdit = computed(() => !!editId.value)
const isFormValid = computed(() =>
  form.value.name.trim() !== '' && form.value.macAddress.trim() !== '' &&
  form.value.esp32Ip.trim() !== '' && form.value.token.trim() !== '' &&
  form.value.windowsPassword.trim() !== '')

onLoad((options: any) => {
  if (options?.id) {
    editId.value = options.id
    const device = getDeviceById(options.id)
    if (device) form.value = { name: device.name, macAddress: device.macAddress, esp32Ip: device.esp32Ip, token: device.token, windowsPassword: device.windowsPassword }
    uni.setNavigationBarTitle({ title: '编辑设备' })
  } else { uni.setNavigationBarTitle({ title: '添加设备' }) }
})

function handleSave() {
  if (!isFormValid.value) return
  if (isEdit.value) { updateDevice(editId.value, form.value); uni.showToast({ title: '已更新', icon: 'success' }) }
  else { addDevice(form.value); uni.showToast({ title: '已添加', icon: 'success' }) }
  setTimeout(() => { uni.navigateBack() }, 500)
}
</script>

<style scoped>
.page { min-height: 100vh; background-color: #FFF8F0; padding: 24rpx 32rpx; }
.section { margin-bottom: 32rpx; }
.section-line {
  display: flex; align-items: center; margin-bottom: 16rpx; padding: 0 4rpx;
}
.section-line::before, .section-line::after {
  content: ''; flex: 1; height: 1rpx;
  background: linear-gradient(90deg, transparent, rgba(192, 132, 252, 0.3), rgba(96, 165, 250, 0.3), transparent);
}
.section-tag { font-size: 22rpx; color: #C084FC; letter-spacing: 2rpx; padding: 0 16rpx; font-weight: 600; }
.form-card {
  border-radius: 20rpx; padding: 8rpx 28rpx;
  background: linear-gradient(145deg, #FFFFFF 0%, #FDF4FF 50%, #EFF6FF 100%);
  border: 1rpx solid rgba(192, 132, 252, 0.1);
  box-shadow: 0 4rpx 24rpx rgba(192, 132, 252, 0.06);
}
.field { padding: 24rpx 0; border-bottom: 1rpx solid rgba(192, 132, 252, 0.06); }
.field.last { border-bottom: none; }
.field-label { font-size: 24rpx; color: #5B21B6; font-weight: 500; margin-bottom: 12rpx; }
.field-input-box {
  background: #FFFFFF; border: 1rpx solid rgba(192, 132, 252, 0.12);
  border-radius: 12rpx; padding: 0 24rpx; height: 84rpx; display: flex; align-items: center;
}
.field-input { width: 100%; font-size: 28rpx; color: #1E1B4B; height: 84rpx; min-height: auto; }
.field-input.mono { font-family: 'SF Mono', 'Consolas', monospace; letter-spacing: 1rpx; }
.ph { color: #D1D5DB; }
.field-hint { font-size: 20rpx; color: #A78BFA; margin-top: 10rpx; }
.submit-wrap { padding: 32rpx 0 64rpx; }
.submit-btn {
  height: 96rpx; line-height: 96rpx; font-size: 30rpx; font-weight: 600; letter-spacing: 2rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #C084FC 50%, #60A5FA 100%);
  color: #FFFFFF; border-radius: 18rpx; border: none;
  box-shadow: 0 6rpx 24rpx rgba(192, 132, 252, 0.3);
}
.submit-btn[disabled] {
  background: linear-gradient(135deg, #FECDD3 0%, #E9D5FF 50%, #BFDBFE 100%);
  color: rgba(255, 255, 255, 0.6); box-shadow: none;
}
.submit-btn::after { border: none; }
</style>