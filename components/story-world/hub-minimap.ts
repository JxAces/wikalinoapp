import { HUB_BOUNDS, HUB_TRAILS } from "./hub-layout";
import type { StoryWorldPosition } from "./story-world.types";

// North is -Z, east is +X. Keep one scale on both axes, with a safe border.
export function minimapPoint(point: StoryWorldPosition) {
  const scale = 88 / Math.max(HUB_BOUNDS.maxX-HUB_BOUNDS.minX,HUB_BOUNDS.maxZ-HUB_BOUNDS.minZ);
  return { x: 50+(point.x-(HUB_BOUNDS.minX+HUB_BOUNDS.maxX)/2)*scale,
    y: 50+(point.z-(HUB_BOUNDS.minZ+HUB_BOUNDS.maxZ)/2)*scale };
}
export function minimapHeading(heading: number) { return 180-heading*180/Math.PI; }

/** Shortest route on the actual path network, including the river bridges. */
export function minimapRoute(from: StoryWorldPosition, target: StoryWorldPosition) {
  const nodes: StoryWorldPosition[] = [], edges: { to:number; cost:number }[][] = [];
  const segments: [number,number][] = [];
  function node(point: StoryWorldPosition) {
    let i=nodes.findIndex(p=>p.x===point.x&&p.z===point.z);
    if(i<0) { i=nodes.length;nodes.push(point);edges.push([]); }return i;
  }
  function link(a:number,b:number) {
    const cost=Math.hypot(nodes[a].x-nodes[b].x,nodes[a].z-nodes[b].z);
    edges[a].push({to:b,cost});edges[b].push({to:a,cost});
  }
  for(const trail of HUB_TRAILS) for(let i=1;i<trail.length;i++) {
    const a=node({x:trail[i-1][0],z:trail[i-1][1]}),b=node({x:trail[i][0],z:trail[i][1]});
    segments.push([a,b]);link(a,b);
  }
  function attach(point:StoryWorldPosition) {
    let best=Infinity, chosen=segments[0], projection=nodes[0];
    for(const [a,b] of segments) {
      const p=nodes[a],q=nodes[b], dx=q.x-p.x,dz=q.z-p.z;
      const t=Math.max(0,Math.min(1,((point.x-p.x)*dx+(point.z-p.z)*dz)/(dx*dx+dz*dz)));
      const at={x:p.x+t*dx,z:p.z+t*dz},d=Math.hypot(point.x-at.x,point.z-at.z);
      if(d<best){best=d;chosen=[a,b];projection=at;}
    }
    const i=node(projection);for(const end of chosen) if(end!==i)link(i,end);
    return {i,chosen};
  }
  const start=attach(from),end=attach(target);
  if(start.chosen.every((v,i)=>v===end.chosen[i]))link(start.i,end.i);
  const distances=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),open=new Set(nodes.map((_,i)=>i));
  distances[start.i]=0;
  while(open.size) {
    const current=[...open].reduce((a,b)=>distances[a]<distances[b]?a:b);open.delete(current);
    if(current===end.i||!Number.isFinite(distances[current]))break;
    for(const edge of edges[current]) if(distances[current]+edge.cost<distances[edge.to]) {
      distances[edge.to]=distances[current]+edge.cost;previous[edge.to]=current;
    }
  }
  const route: StoryWorldPosition[]=[];
  for(let i=end.i;i!==-1;i=previous[i]){route.unshift(nodes[i]);if(i===start.i)break;}
  return [from,...route,target];
}
