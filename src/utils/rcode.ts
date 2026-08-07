// RCODE 徽章配色（Mantine 主题色名），DNS Client 与查询日志页面共用
export function getRcodeColor(rcode: string | undefined): string {
  switch (rcode) {
    case 'NoError':
      return 'green';
    case 'NXDomain':
      return 'orange';
    case 'ServerFailure':
      return 'red';
    case 'Refused':
      return 'cyan';
    case 'NotImplemented':
      return 'yellow';
    default:
      return 'gray';
  }
}
