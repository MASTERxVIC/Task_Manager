
export function getDeviceId() {
  let deviceId = localStorage.getItem('app_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('app_device_id', deviceId);
  }
  return deviceId;
}