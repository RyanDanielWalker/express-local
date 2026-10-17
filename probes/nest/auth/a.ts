import { UnauthorizedException } from '@nestjs/common';
function pick(req: any) {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (type?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException();
    }
    return token;
}
for (const h of ['Bearer abc', 'bearer abc', 'abc', 'Basic abc', undefined, 'Bearer ']) {
  try { console.log(JSON.stringify(h), '->', pick({ headers: { authorization: h } })) } catch { console.log(JSON.stringify(h), '-> 401') }
}
