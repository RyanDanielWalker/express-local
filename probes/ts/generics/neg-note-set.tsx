// Should fail: claims an empty Set gives any (it is unknown; Map is the any one).
type IsAny<T> = 0 extends 1 & T ? true : false;
const s = new Set();
s.forEach((item) => { const wrong: IsAny<typeof item> = true; });
export {};
