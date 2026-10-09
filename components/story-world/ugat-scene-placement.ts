/** A single placement transform keeps art, actors, effects and collisions aligned. */
export const UGAT_SCENE_PLACEMENTS = [
  {fromX:-4.5,fromZ:5.7,x:-5.05,z:7,angle:.55,scale:1},
  {fromX:5.65,fromZ:.1,x:5.3,z:1.5,angle:-.55,scale:1},
  {fromX:-5.35,fromZ:-5.9,x:-5.2,z:-5,angle:.55,scale:1},
  {fromX:0,fromZ:-10.52,x:5.4,z:-10.1,angle:-.6,scale:.75},
] as const;

export function ugatScenePoint(index:number,x:number,z:number) {
  const p=UGAT_SCENE_PLACEMENTS[index],dx=(x-p.fromX)*p.scale,dz=(z-p.fromZ)*p.scale;
  return {x:p.x+Math.cos(p.angle)*dx+Math.sin(p.angle)*dz,z:p.z-Math.sin(p.angle)*dx+Math.cos(p.angle)*dz};
}
export function ugatSceneRect<T extends {x:number;z:number;w:number;d:number}>(index:number,rect:T) {
  const p=UGAT_SCENE_PLACEMENTS[index],c=Math.abs(Math.cos(p.angle)),s=Math.abs(Math.sin(p.angle));
  return {...rect,...ugatScenePoint(index,rect.x,rect.z),w:(rect.w*c+rect.d*s)*p.scale,d:(rect.w*s+rect.d*c)*p.scale};
}
