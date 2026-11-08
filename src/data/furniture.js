export const FURNITURE = {
  'bed-pine': {
    name: '松木小床', w: 2, h: 3, solid: true, kind: 'bed',
    desc: '晒过太阳的松木味，是小镇给旅人的第一份礼物。',
    interact: { label: '小睡一会', type: 'rest' }
  },
  'chair-oak': {
    name: '橡木椅', w: 1, h: 1, solid: true, kind: 'chair',
    desc: '坐上去会发出轻轻的吱呀声。',
    interact: { label: '坐下', type: 'sit' }
  },
  'table-oak': {
    name: '圆木餐桌', w: 2, h: 1, solid: true, kind: 'table',
    desc: '桌面上有一圈年轮，像一个小小的湖泊。',
    interact: { label: '看看桌面', type: 'table' }
  },
  'rug-woven': {
    name: '编织小毯', w: 2, h: 2, solid: false, kind: 'rug',
    desc: '苔溪的手工艺品，踩上去暖乎乎的。',
    interact: { label: '踩一踩', type: 'rug' }
  },
  'plant-sprout': {
    name: '绿芽盆栽', w: 1, h: 1, solid: true, kind: 'plant',
    desc: '据说会记住每天路过它的人。',
    interact: { label: '浇水', type: 'water' }
  },
  'lamp-floor': {
    name: '暖光落地灯', w: 1, h: 1, solid: true, kind: 'lamp',
    desc: '夜里写代码时最可靠的小伙伴。',
    interact: { label: '开关灯', type: 'lamp' }
  },
  'shelf-pine': {
    name: '杉木书架', w: 1, h: 2, solid: true, kind: 'shelf',
    desc: '书脊上有小镇各处的旅行札记。',
    interact: { label: '翻翻书', type: 'read' }
  },
  'desk-code': {
    name: '代码工作台', w: 2, h: 1, solid: true, kind: 'desk',
    desc: '一台嗡嗡作响的老电脑，屏幕泛着绿光。',
    interact: { label: '打开课程', type: 'code' }
  },
  'aquarium': {
    name: '玻璃鱼缸', w: 2, h: 1, solid: true, kind: 'aquarium',
    desc: '两条小鱼在玻璃里练习绕圈。',
    interact: { label: '看看鱼', type: 'fish' }
  },
  'cat-bed': {
    name: '猫爪睡垫', w: 1, h: 1, solid: true, kind: 'cat',
    desc: '软垫中央有一个小小的爪印。总觉得谁刚离开。',
    interact: { label: '摸摸垫子', type: 'cat' }
  },
  'lamp-crystal': {
    name: '星晶灯', w: 1, h: 1, solid: true, kind: 'lamp',
    desc: '发光的水晶，里面像封着一段夜空。',
    interact: { label: '开关灯', type: 'lamp' }
  },
  'stool-mushroom': {
    name: '蘑菇矮凳', w: 1, h: 1, solid: true, kind: 'chair',
    desc: '矮矮的，很像森林邮差留下的礼物。',
    interact: { label: '坐下', type: 'sit' }
  },
  'cabinet-clay': {
    name: '陶罐木柜', w: 1, h: 2, solid: true, kind: 'cabinet',
    desc: '柜子里有陶罐碰撞的清脆声响。',
    interact: { label: '打开柜门', type: 'storage' }
  },
  'wardrobe': {
    name: '旧木衣柜', w: 2, h: 2, solid: true, kind: 'cabinet',
    desc: '打开时有一股旧纸和雨水的味道。',
    interact: { label: '打开衣柜', type: 'storage' }
  },
  'rug-star': {
    name: '星图地毯', w: 3, h: 2, solid: false, kind: 'rug',
    desc: '据说是观星台淘汰下来的旧星图。',
    interact: { label: '认认星座', type: 'starRug' }
  },
  'candle': {
    name: '蜂蜡烛台', w: 1, h: 1, solid: true, kind: 'candle',
    desc: '火苗很小，但足够照亮一封信。',
    interact: { label: '看看火苗', type: 'candle' }
  },
  'guitar': {
    name: '旧木吉他', w: 1, h: 1, solid: true, kind: 'guitar',
    desc: '少了一根弦，但仍能弹出完整的晚风。',
    interact: { label: '拨一下', type: 'guitar' }
  },
  'plant-tall': {
    name: '高个绿植', w: 1, h: 1, solid: true, kind: 'plant',
    desc: '叶子快碰到天花板了，它自己好像很得意。',
    interact: { label: '擦擦叶子', type: 'water' }
  }
};

export const FURNITURE_IDS = Object.keys(FURNITURE);

export function furnitureSize(id, rot = 0) {
  const item = FURNITURE[id];
  if (!item) return { w: 1, h: 1 };
  return rot % 2 === 0 ? { w: item.w, h: item.h } : { w: item.h, h: item.w };
}

export const STARTER_INVENTORY = {
  'chair-oak': 2,
  'candle': 1
};

export const WALLPAPERS = [
  {
    id: 'warm', name: '暖麦', motif: 'stripe',
    wall: '#e7d3ad', stripe: '#dfc7a0', faint: 'rgba(196, 168, 128, .25)',
    wain: '#8a6447', wainHi: '#b48963', wainLo: '#6f4f38', top: 'rgba(120, 92, 63, .25)'
  },
  {
    id: 'mint', name: '薄荷', motif: 'dot',
    wall: '#d6e7d4', stripe: '#c4dbc4', faint: 'rgba(120, 157, 126, .22)',
    wain: '#6e8a68', wainHi: '#9ab892', wainLo: '#56714f', top: 'rgba(74, 104, 72, .22)'
  },
  {
    id: 'dusk', name: '暮蓝', motif: 'panel',
    wall: '#bac9dd', stripe: '#a9bbd1', faint: 'rgba(96, 120, 150, .2)',
    wain: '#5b6e8a', wainHi: '#8fa4bd', wainLo: '#465a74', top: 'rgba(58, 78, 104, .25)'
  },
  {
    id: 'sakura', name: '樱吹雪', motif: 'petal',
    wall: '#f0d7d4', stripe: '#e5c4c2', faint: 'rgba(199, 142, 146, .18)',
    wain: '#a56f6d', wainHi: '#d3a19b', wainLo: '#835453', top: 'rgba(147, 92, 91, .2)'
  },
  {
    id: 'starry', name: '星野', motif: 'star',
    wall: '#4a5878', stripe: '#5d6d8f', faint: 'rgba(230, 235, 255, .14)',
    wain: '#35415e', wainHi: '#6b7aa0', wainLo: '#29334c', top: 'rgba(20, 28, 45, .35)'
  },
  {
    id: 'honey', name: '蜂蜜格', motif: 'check',
    wall: '#ecdfc4', stripe: '#e0d0b0', faint: 'rgba(255, 255, 255, .25)',
    wain: '#9b7a4f', wainHi: '#c6a474', wainLo: '#7a5c38', top: 'rgba(112, 84, 50, .22)'
  }
];

export function wallpaperById(id) {
  return WALLPAPERS.find((paper) => paper.id === id) || WALLPAPERS[0];
}

export const STARTER_ROOM = {
  items: [
    { uid: 'home-bed-1', id: 'bed-pine', x: 4, y: 7, rot: 0 },
    { uid: 'home-plant-1', id: 'plant-sprout', x: 17, y: 8, rot: 0 },
    { uid: 'home-rug-1', id: 'rug-woven', x: 8, y: 8, rot: 0 }
  ],
  lampOn: true,
  wallpaper: 'warm'
};

export const BOOK_QUOTES = [
  '《苔溪植物志》：第三章写着，“春天会从门缝里挤进来”。',
  '一张夹在书里的便签：“如果迷路了，就沿着路灯走。”',
  '《如何与一条蟒蛇相处》：第一页只有一句话——先打招呼。',
  '旧账本上记着：7 枚铜币，买一把伞，送给淋湿的邮差。',
  '《北岭夜航图》：星星都在，只是有时候需要抬头。'
];
