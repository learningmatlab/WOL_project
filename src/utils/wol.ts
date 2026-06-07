import type { Device } from './device-store'

/**
 * 将 MAC 地址字符串转换为 102 字节的 WOL 魔术包二进制数据
 * @param mac - 格式如 "A1:B2:C3:D4:E5:F6" 的 MAC 地址
 * @returns ArrayBuffer
 */
export function createMagicPacket(mac: string): ArrayBuffer {
  const cleanMac = mac.replace(/[: -]/g, '').toUpperCase()
  if (cleanMac.length !== 12) {
    throw new Error('MAC地址格式不正确，必须为12位16进制字符')
  }

  const macBytes = new Uint8Array(6)
  for (let i = 0; i < 6; i++) {
    macBytes[i] = parseInt(cleanMac.substring(i * 2, i * 2 + 2), 16)
  }

  // 6字节 0xFF + 16次重复的 MAC 地址 = 102 字节
  const buffer = new Uint8Array(102)
  for (let i = 0; i < 6; i++) {
    buffer[i] = 0xff
  }
  for (let i = 0; i < 16; i++) {
    buffer.set(macBytes, 6 + i * 6)
  }

  return buffer.buffer
}

/** WOL 操作结果 */
export interface WolResult {
  success: boolean
  message: string
}

/**
 * 第一步：通过 UDP 广播发送 WOL 魔术包唤醒电脑
 */
export function sendWolPacket(macAddress: string): Promise<WolResult> {
  return new Promise((resolve, reject) => {
    try {
      const packetData = createMagicPacket(macAddress)
      const udpSocket = uni.createUDPSocket()

      udpSocket.onError((err: any) => {
        udpSocket.close()
        reject(new Error('UDP发送失败: ' + (err.errMsg || err.message || '未知错误')))
      })

      udpSocket.send({
        address: '255.255.255.255',
        port: 9,
        message: packetData,
      })

      // UDP 是无连接的，发送后短暂等待再关闭
      setTimeout(() => {
        udpSocket.close()
        console.log('WOL 魔术包广播成功')
        resolve({ success: true, message: '魔术包已发送' })
      }, 500)
    } catch (e: any) {
      reject(new Error(e.message || '魔术包生成失败'))
    }
  })
}

/**
 * 第二步：等待 ESP32 上线后，发送 HTTP 请求执行解锁
 * @param esp32Ip - ESP32 局域网 IP
 * @param password - Windows 锁屏密码
 * @param token - 安全暗号
 * @param delay - 等待 ESP32 启动的延迟（毫秒），默认 5500ms
 */
export function sendUnlockRequest(
  esp32Ip: string,
  password: string,
  token: string,
  delay: number = 5500
): Promise<WolResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      uni.request({
        url: `http://${esp32Ip}/unlock`,
        method: 'GET',
        data: { pwd: password, token },
        timeout: 5000,
        success(res: any) {
          if (res.statusCode === 200) {
            resolve({ success: true, message: '解锁成功' })
          } else {
            resolve({ success: false, message: '密码错误或暗号不匹配' })
          }
        },
        fail(err: any) {
          reject(
            new Error('连接ESP32失败，请确认电脑已开机且开发板已连上Wi-Fi')
          )
        },
      })
    }, delay)
  })
}

/**
 * 预检测：尝试 ping ESP32，判断电脑是否已开机
 * @returns true 表示 ESP32 在线（电脑已开机）
 */
export function checkEsp32Online(esp32Ip: string): Promise<boolean> {
  return new Promise((resolve) => {
    uni.request({
      url: `http://${esp32Ip}/status`,
      method: 'GET',
      timeout: 2000,
      success() { resolve(true) },
      fail() { resolve(false) },
    })
  })
}

/**
 * 一键开机+解锁：先检测电脑状态，已开机则直接解锁，否则先唤醒再解锁
 */
export async function wakeAndUnlock(
  device: Device,
  onStatusChange: (status: string) => void
): Promise<WolResult> {
  try {
    // 预检测：ESP32 是否在线
    onStatusChange('检测电脑状态...')
    const isOnline = await checkEsp32Online(device.esp32Ip)
    
    if (isOnline) {
      // 电脑已开机，直接解锁
      onStatusChange('电脑已开机，正在解锁...')
      const result = await sendUnlockRequest(
        device.esp32Ip,
        device.windowsPassword,
        device.token,
        0 // 不需要等待
      )
      return result
    }
    
    // 电脑未开机，先唤醒再解锁
    onStatusChange('正在发送开机信号...')
    await sendWolPacket(device.macAddress)

    onStatusChange('等待解锁挂件上线...')
    const result = await sendUnlockRequest(
      device.esp32Ip,
      device.windowsPassword,
      device.token
    )

    return result
  } catch (e: any) {
    return { success: false, message: e.message || '操作失败' }
  }
}
