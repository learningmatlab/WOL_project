/** 设备信息接口 */
export interface Device {
  /** 唯一标识 */
  id: string
  /** 设备名称，如 "我的台式机" */
  name: string
  /** 目标电脑网卡的 MAC 地址 */
  macAddress: string
  /** ESP32-S3 在局域网中的 IP 地址 */
  esp32Ip: string
  /** 局域网安全暗号 */
  token: string
  /** Windows 锁屏密码 */
  windowsPassword: string
  /** Wi-Fi 名称 */
  wifiSsid: string
  /** Wi-Fi 密码 */
  wifiPassword: string
}

const STORAGE_KEY = 'WOL_DEVICES'

/** 生成唯一 ID */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** 获取所有设备 */
export function getDevices(): Device[] {
  const raw = uni.getStorageSync(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Device[]
  } catch {
    return []
  }
}

/** 保存所有设备 */
function saveDevices(devices: Device[]): void {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(devices))
}

/** 添加设备 */
export function addDevice(device: Omit<Device, 'id'>): Device {
  const devices = getDevices()
  const newDevice: Device = { ...device, id: generateId() }
  devices.push(newDevice)
  saveDevices(devices)
  return newDevice
}

/** 更新设备 */
export function updateDevice(id: string, data: Partial<Omit<Device, 'id'>>): Device | null {
  const devices = getDevices()
  const index = devices.findIndex((d) => d.id === id)
  if (index === -1) return null
  devices[index] = { ...devices[index], ...data }
  saveDevices(devices)
  return devices[index]
}

/** 删除设备 */
export function deleteDevice(id: string): boolean {
  const devices = getDevices()
  const filtered = devices.filter((d) => d.id !== id)
  if (filtered.length === devices.length) return false
  saveDevices(filtered)
  return true
}

/** 根据 ID 获取设备 */
export function getDeviceById(id: string): Device | null {
  return getDevices().find((d) => d.id === id) ?? null
}
