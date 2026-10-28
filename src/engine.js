/** Pure, dependency-free packing rules. Coordinates are grid cells, not pixels. */

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const ITEMS = deepFreeze({
  bag: { name: 'Чемодан', color: '#D9915D', shape: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  watermelon: { name: 'Арбуз', color: '#6C9970', shape: [[0, 0], [1, 0]] },
  plant: { name: 'Рассада', color: '#8CA46B', shape: [[0, 0], [0, 1], [1, 1]] },
  toolbox: { name: 'Инструменты', color: '#C96858', shape: [[0, 0], [1, 0], [2, 0]] },
  cooler: { name: 'Холодильник', color: '#72A3AA', shape: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  chair: { name: 'Складной стул', color: '#BC9C71', shape: [[0, 0], [0, 1], [0, 2], [1, 2]] },
  ball: { name: 'Мяч', color: '#E3BC68', shape: [[0, 0]] },
  thermos: { name: 'Термос', color: '#899CAD', shape: [[0, 0], [0, 1]] },
  tent: { name: 'Палатка', color: '#86A487', shape: [[0, 0], [1, 0], [2, 0], [1, 1]] },
  boots: { name: 'Сапоги', color: '#B38D74', shape: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  basket: { name: 'Корзина', color: '#CEAA70', shape: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]] },
  rod: { name: 'Удочка', color: '#A38C77', shape: [[0, 0], [0, 1], [0, 2], [0, 3]] },
});

const TITLES = [
  'Первый выезд', 'Пикник вдвоём', 'Бабушкины гостинцы', 'Без лишних вещей', 'Саженцы для грядки',
  'За город!', 'Маленький багажник', 'Место для арбуза', 'Всё пригодится', 'Дачный экспресс',
  'Рассвет у озера', 'Рыбалка с друзьями', 'Складной стул', 'Запас на выходные', 'Тихая заводь',
  'Большой улов', 'Палатка на берегу', 'Дождю назло', 'Последняя удочка', 'Поехали к воде!',
  'Смена адреса', 'Ничего не забыли?', 'Кресло поместится', 'Вещи с антресолей', 'Три коробки сверху',
  'В узкую щель', 'Заберём всё', 'И ещё один чемодан', 'Большой багажник', 'Мастер упаковки',
];
const CHAPTERS = ['На дачу', 'На рыбалку', 'Большой переезд'];

// Every layout was solved and verified offline; there is no runtime level search.
const LEVEL_LAYOUTS = [
  {"cols":5,"rows":5,"blocked":[[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[4,1],[0,2],[4,2],[0,3],[4,3],[0,4],[1,4],[2,4],[3,4],[4,4]],"pieces":[{"id":"p1","kind":"watermelon"},{"id":"p2","kind":"toolbox"},{"id":"p3","kind":"bag"}],"solution":{"p1":{"x":1,"y":1,"rotation":0},"p2":{"x":3,"y":1,"rotation":1},"p3":{"x":1,"y":2,"rotation":0}}},
  {"cols":5,"rows":5,"blocked":[[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[4,1],[0,2],[4,2],[0,3],[4,3],[0,4],[4,4]],"pieces":[{"id":"p1","kind":"watermelon"},{"id":"p2","kind":"toolbox"},{"id":"p3","kind":"plant"},{"id":"p4","kind":"bag"}],"solution":{"p1":{"x":1,"y":1,"rotation":0},"p2":{"x":1,"y":2,"rotation":1},"p3":{"x":2,"y":1,"rotation":3},"p4":{"x":2,"y":3,"rotation":0}}},
  {"cols":5,"rows":5,"blocked":[[0,0],[1,0],[2,0],[3,0],[4,0],[4,1],[4,2],[4,3],[0,4],[1,4],[2,4],[3,4],[4,4]],"pieces":[{"id":"p1","kind":"bag"},{"id":"p2","kind":"toolbox"},{"id":"p3","kind":"thermos"},{"id":"p4","kind":"plant"}],"solution":{"p1":{"x":0,"y":1,"rotation":0},"p2":{"x":0,"y":3,"rotation":0},"p3":{"x":3,"y":2,"rotation":0},"p4":{"x":2,"y":1,"rotation":1}}},
  {"cols":5,"rows":5,"blocked":[[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[3,1],[4,1],[4,2],[4,3],[0,4],[3,4],[4,4]],"pieces":[{"id":"p1","kind":"basket"},{"id":"p2","kind":"thermos"},{"id":"p3","kind":"plant"},{"id":"p4","kind":"watermelon"}],"solution":{"p1":{"x":1,"y":1,"rotation":1},"p2":{"x":0,"y":2,"rotation":0},"p3":{"x":2,"y":2,"rotation":2},"p4":{"x":1,"y":4,"rotation":0}}},
  {"cols":5,"rows":5,"blocked":[[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[3,1],[4,1],[4,2],[4,3],[4,4]],"pieces":[{"id":"p1","kind":"toolbox"},{"id":"p2","kind":"chair"},{"id":"p3","kind":"cooler"},{"id":"p4","kind":"plant"}],"solution":{"p1":{"x":1,"y":1,"rotation":1},"p2":{"x":0,"y":2,"rotation":0},"p3":{"x":2,"y":3,"rotation":0},"p4":{"x":2,"y":1,"rotation":0}}},
  {"cols":5,"rows":5,"blocked":[[0,0],[1,0],[2,0],[3,0],[4,0],[4,1],[4,2],[4,3],[4,4]],"pieces":[{"id":"p1","kind":"watermelon"},{"id":"p2","kind":"ball"},{"id":"p3","kind":"bag"},{"id":"p4","kind":"basket"},{"id":"p5","kind":"chair"}],"solution":{"p1":{"x":0,"y":1,"rotation":1},"p2":{"x":3,"y":3,"rotation":0},"p3":{"x":0,"y":3,"rotation":0},"p4":{"x":1,"y":1,"rotation":2},"p5":{"x":2,"y":2,"rotation":0}}},
  {"cols":5,"rows":5,"blocked":[[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[4,1]],"pieces":[{"id":"p1","kind":"cooler"},{"id":"p2","kind":"toolbox"},{"id":"p3","kind":"cooler"},{"id":"p4","kind":"plant"},{"id":"p5","kind":"chair"}],"solution":{"p1":{"x":0,"y":3,"rotation":0},"p2":{"x":2,"y":4,"rotation":0},"p3":{"x":2,"y":1,"rotation":0},"p4":{"x":0,"y":1,"rotation":3},"p5":{"x":2,"y":2,"rotation":3}}},
  {"cols":5,"rows":5,"blocked":[[0,0],[1,0],[2,0],[3,0],[4,0],[0,4],[4,4]],"pieces":[{"id":"p1","kind":"basket"},{"id":"p2","kind":"watermelon"},{"id":"p3","kind":"cooler"},{"id":"p4","kind":"toolbox"},{"id":"p5","kind":"chair"}],"solution":{"p1":{"x":2,"y":2,"rotation":2},"p2":{"x":0,"y":1,"rotation":0},"p3":{"x":0,"y":2,"rotation":0},"p4":{"x":2,"y":1,"rotation":0},"p5":{"x":1,"y":3,"rotation":3}}},
  {"cols":5,"rows":5,"blocked":[[0,0],[1,0],[2,0],[3,0],[4,0]],"pieces":[{"id":"p1","kind":"toolbox"},{"id":"p2","kind":"cooler"},{"id":"p3","kind":"plant"},{"id":"p4","kind":"cooler"},{"id":"p5","kind":"thermos"},{"id":"p6","kind":"bag"}],"solution":{"p1":{"x":0,"y":1,"rotation":1},"p2":{"x":1,"y":1,"rotation":0},"p3":{"x":0,"y":3,"rotation":3},"p4":{"x":3,"y":1,"rotation":0},"p5":{"x":2,"y":3,"rotation":0},"p6":{"x":3,"y":3,"rotation":0}}},
  {"cols":5,"rows":5,"blocked":[[0,0],[4,0],[0,4],[4,4]],"pieces":[{"id":"p1","kind":"bag"},{"id":"p2","kind":"cooler"},{"id":"p3","kind":"bag"},{"id":"p4","kind":"toolbox"},{"id":"p5","kind":"toolbox"},{"id":"p6","kind":"plant"}],"solution":{"p1":{"x":1,"y":0,"rotation":0},"p2":{"x":3,"y":2,"rotation":0},"p3":{"x":1,"y":2,"rotation":0},"p4":{"x":0,"y":1,"rotation":1},"p5":{"x":1,"y":4,"rotation":0},"p6":{"x":3,"y":0,"rotation":0}}},
  {"cols":6,"rows":5,"blocked":[[0,0],[5,0],[0,4],[1,4],[4,4],[5,4]],"pieces":[{"id":"p1","kind":"tent"},{"id":"p2","kind":"boots"},{"id":"p3","kind":"boots"},{"id":"p4","kind":"chair"},{"id":"p5","kind":"tent"},{"id":"p6","kind":"rod"}],"solution":{"p1":{"x":0,"y":1,"rotation":3},"p2":{"x":1,"y":1,"rotation":0},"p3":{"x":1,"y":3,"rotation":0},"p4":{"x":3,"y":2,"rotation":3},"p5":{"x":3,"y":1,"rotation":0},"p6":{"x":1,"y":0,"rotation":1}}},
  {"cols":6,"rows":5,"blocked":[[0,0],[5,0],[0,4],[5,4]],"pieces":[{"id":"p1","kind":"rod"},{"id":"p2","kind":"chair"},{"id":"p3","kind":"toolbox"},{"id":"p4","kind":"chair"},{"id":"p5","kind":"plant"},{"id":"p6","kind":"boots"},{"id":"p7","kind":"rod"}],"solution":{"p1":{"x":2,"y":1,"rotation":1},"p2":{"x":2,"y":2,"rotation":1},"p3":{"x":2,"y":0,"rotation":0},"p4":{"x":3,"y":2,"rotation":3},"p5":{"x":0,"y":2,"rotation":3},"p6":{"x":0,"y":0,"rotation":1},"p7":{"x":1,"y":4,"rotation":1}}},
  {"cols":6,"rows":5,"blocked":[[0,4],[1,4],[2,4],[3,4],[4,4],[5,4]],"pieces":[{"id":"p1","kind":"plant"},{"id":"p2","kind":"basket"},{"id":"p3","kind":"boots"},{"id":"p4","kind":"toolbox"},{"id":"p5","kind":"rod"},{"id":"p6","kind":"watermelon"},{"id":"p7","kind":"toolbox"}],"solution":{"p1":{"x":0,"y":0,"rotation":0},"p2":{"x":3,"y":0,"rotation":3},"p3":{"x":1,"y":0,"rotation":0},"p4":{"x":5,"y":0,"rotation":1},"p5":{"x":0,"y":3,"rotation":1},"p6":{"x":4,"y":3,"rotation":0},"p7":{"x":0,"y":2,"rotation":0}}},
  {"cols":6,"rows":5,"blocked":[[0,0],[1,0],[4,0],[5,0],[0,1],[5,1]],"pieces":[{"id":"p1","kind":"cooler"},{"id":"p2","kind":"rod"},{"id":"p3","kind":"toolbox"},{"id":"p4","kind":"ball"},{"id":"p5","kind":"chair"},{"id":"p6","kind":"basket"},{"id":"p7","kind":"toolbox"}],"solution":{"p1":{"x":2,"y":0,"rotation":0},"p2":{"x":1,"y":1,"rotation":0},"p3":{"x":0,"y":2,"rotation":1},"p4":{"x":3,"y":3,"rotation":0},"p5":{"x":2,"y":1,"rotation":3},"p6":{"x":2,"y":3,"rotation":0},"p7":{"x":5,"y":2,"rotation":1}}},
  {"cols":6,"rows":5,"blocked":[[0,0],[5,0]],"pieces":[{"id":"p1","kind":"watermelon"},{"id":"p2","kind":"basket"},{"id":"p3","kind":"rod"},{"id":"p4","kind":"bag"},{"id":"p5","kind":"boots"},{"id":"p6","kind":"basket"},{"id":"p7","kind":"chair"}],"solution":{"p1":{"x":0,"y":4,"rotation":0},"p2":{"x":0,"y":1,"rotation":1},"p3":{"x":5,"y":1,"rotation":0},"p4":{"x":3,"y":3,"rotation":0},"p5":{"x":1,"y":0,"rotation":0},"p6":{"x":3,"y":0,"rotation":3},"p7":{"x":1,"y":2,"rotation":2}}},
  {"cols":6,"rows":5,"blocked":[],"pieces":[{"id":"p1","kind":"watermelon"},{"id":"p2","kind":"tent"},{"id":"p3","kind":"plant"},{"id":"p4","kind":"boots"},{"id":"p5","kind":"basket"},{"id":"p6","kind":"chair"},{"id":"p7","kind":"rod"},{"id":"p8","kind":"bag"}],"solution":{"p1":{"x":0,"y":0,"rotation":0},"p2":{"x":3,"y":0,"rotation":0},"p3":{"x":1,"y":0,"rotation":3},"p4":{"x":4,"y":1,"rotation":1},"p5":{"x":3,"y":3,"rotation":0},"p6":{"x":1,"y":1,"rotation":3},"p7":{"x":0,"y":1,"rotation":0},"p8":{"x":1,"y":3,"rotation":0}}},
  {"cols":6,"rows":5,"blocked":[[0,0],[5,0],[0,4],[5,4]],"pieces":[{"id":"p1","kind":"ball"},{"id":"p2","kind":"basket"},{"id":"p3","kind":"watermelon"},{"id":"p4","kind":"boots"},{"id":"p5","kind":"cooler"},{"id":"p6","kind":"watermelon"},{"id":"p7","kind":"bag"},{"id":"p8","kind":"rod"}],"solution":{"p1":{"x":0,"y":1,"rotation":0},"p2":{"x":2,"y":2,"rotation":0},"p3":{"x":3,"y":1,"rotation":1},"p4":{"x":3,"y":0,"rotation":0},"p5":{"x":0,"y":2,"rotation":0},"p6":{"x":5,"y":2,"rotation":1},"p7":{"x":1,"y":0,"rotation":0},"p8":{"x":1,"y":4,"rotation":1}}},
  {"cols":6,"rows":5,"blocked":[[0,0],[1,0],[4,0],[5,0],[0,4],[1,4],[4,4],[5,4]],"pieces":[{"id":"p1","kind":"bag"},{"id":"p2","kind":"ball"},{"id":"p3","kind":"ball"},{"id":"p4","kind":"watermelon"},{"id":"p5","kind":"watermelon"},{"id":"p6","kind":"rod"},{"id":"p7","kind":"rod"},{"id":"p8","kind":"bag"}],"solution":{"p1":{"x":2,"y":0,"rotation":0},"p2":{"x":0,"y":1,"rotation":0},"p3":{"x":1,"y":1,"rotation":0},"p4":{"x":4,"y":1,"rotation":0},"p5":{"x":2,"y":4,"rotation":0},"p6":{"x":0,"y":2,"rotation":1},"p7":{"x":0,"y":3,"rotation":1},"p8":{"x":4,"y":2,"rotation":0}}},
  {"cols":6,"rows":5,"blocked":[[0,0],[5,0]],"pieces":[{"id":"p1","kind":"cooler"},{"id":"p2","kind":"rod"},{"id":"p3","kind":"boots"},{"id":"p4","kind":"toolbox"},{"id":"p5","kind":"plant"},{"id":"p6","kind":"boots"},{"id":"p7","kind":"rod"},{"id":"p8","kind":"watermelon"}],"solution":{"p1":{"x":0,"y":3,"rotation":0},"p2":{"x":0,"y":2,"rotation":1},"p3":{"x":1,"y":0,"rotation":0},"p4":{"x":2,"y":3,"rotation":0},"p5":{"x":4,"y":2,"rotation":2},"p6":{"x":3,"y":0,"rotation":0},"p7":{"x":2,"y":4,"rotation":1},"p8":{"x":0,"y":1,"rotation":0}}},
  {"cols":6,"rows":5,"blocked":[],"pieces":[{"id":"p1","kind":"cooler"},{"id":"p2","kind":"basket"},{"id":"p3","kind":"rod"},{"id":"p4","kind":"tent"},{"id":"p5","kind":"rod"},{"id":"p6","kind":"toolbox"},{"id":"p7","kind":"thermos"},{"id":"p8","kind":"cooler"}],"solution":{"p1":{"x":0,"y":0,"rotation":0},"p2":{"x":0,"y":2,"rotation":1},"p3":{"x":2,"y":0,"rotation":1},"p4":{"x":1,"y":3,"rotation":0},"p5":{"x":2,"y":1,"rotation":1},"p6":{"x":3,"y":4,"rotation":0},"p7":{"x":2,"y":2,"rotation":1},"p8":{"x":4,"y":2,"rotation":0}}},
  {"cols":6,"rows":6,"blocked":[[0,0],[1,0],[4,0],[5,0],[0,1],[5,1],[0,5],[1,5],[4,5],[5,5]],"pieces":[{"id":"p1","kind":"tent"},{"id":"p2","kind":"thermos"},{"id":"p3","kind":"basket"},{"id":"p4","kind":"rod"},{"id":"p5","kind":"chair"},{"id":"p6","kind":"bag"},{"id":"p7","kind":"ball"},{"id":"p8","kind":"thermos"}],"solution":{"p1":{"x":1,"y":0,"rotation":1},"p2":{"x":3,"y":0,"rotation":0},"p3":{"x":1,"y":2,"rotation":0},"p4":{"x":4,"y":1,"rotation":0},"p5":{"x":0,"y":2,"rotation":0},"p6":{"x":2,"y":4,"rotation":0},"p7":{"x":5,"y":2,"rotation":0},"p8":{"x":5,"y":3,"rotation":0}}},
  {"cols":6,"rows":6,"blocked":[[0,0],[5,0],[0,5],[5,5]],"pieces":[{"id":"p1","kind":"basket"},{"id":"p2","kind":"rod"},{"id":"p3","kind":"watermelon"},{"id":"p4","kind":"bag"},{"id":"p5","kind":"basket"},{"id":"p6","kind":"chair"},{"id":"p7","kind":"tent"},{"id":"p8","kind":"boots"}],"solution":{"p1":{"x":1,"y":0,"rotation":1},"p2":{"x":0,"y":1,"rotation":0},"p3":{"x":2,"y":1,"rotation":0},"p4":{"x":1,"y":3,"rotation":0},"p5":{"x":3,"y":2,"rotation":2},"p6":{"x":1,"y":4,"rotation":3},"p7":{"x":4,"y":3,"rotation":3},"p8":{"x":3,"y":0,"rotation":0}}},
  {"cols":6,"rows":6,"blocked":[[0,0],[1,0],[4,0],[5,0],[0,5],[1,5],[4,5],[5,5]],"pieces":[{"id":"p1","kind":"rod"},{"id":"p2","kind":"rod"},{"id":"p3","kind":"cooler"},{"id":"p4","kind":"watermelon"},{"id":"p5","kind":"chair"},{"id":"p6","kind":"chair"},{"id":"p7","kind":"boots"},{"id":"p8","kind":"watermelon"}],"solution":{"p1":{"x":2,"y":0,"rotation":0},"p2":{"x":3,"y":0,"rotation":0},"p3":{"x":4,"y":1,"rotation":0},"p4":{"x":5,"y":3,"rotation":1},"p5":{"x":0,"y":1,"rotation":2},"p6":{"x":0,"y":2,"rotation":0},"p7":{"x":3,"y":3,"rotation":1},"p8":{"x":2,"y":4,"rotation":1}}},
  {"cols":6,"rows":6,"blocked":[[0,0],[5,0],[0,1],[5,1],[0,5],[1,5],[4,5],[5,5]],"pieces":[{"id":"p1","kind":"plant"},{"id":"p2","kind":"plant"},{"id":"p3","kind":"watermelon"},{"id":"p4","kind":"watermelon"},{"id":"p5","kind":"ball"},{"id":"p6","kind":"basket"},{"id":"p7","kind":"rod"},{"id":"p8","kind":"boots"},{"id":"p9","kind":"boots"}],"solution":{"p1":{"x":0,"y":3,"rotation":0},"p2":{"x":0,"y":2,"rotation":2},"p3":{"x":1,"y":1,"rotation":0},"p4":{"x":2,"y":5,"rotation":0},"p5":{"x":5,"y":3,"rotation":0},"p6":{"x":2,"y":2,"rotation":1},"p7":{"x":1,"y":0,"rotation":1},"p8":{"x":3,"y":1,"rotation":0},"p9":{"x":3,"y":3,"rotation":0}}},
  {"cols":6,"rows":6,"blocked":[[0,0],[5,0],[0,5],[5,5]],"pieces":[{"id":"p1","kind":"chair"},{"id":"p2","kind":"cooler"},{"id":"p3","kind":"cooler"},{"id":"p4","kind":"boots"},{"id":"p5","kind":"tent"},{"id":"p6","kind":"plant"},{"id":"p7","kind":"tent"},{"id":"p8","kind":"watermelon"},{"id":"p9","kind":"plant"}],"solution":{"p1":{"x":1,"y":0,"rotation":0},"p2":{"x":2,"y":0,"rotation":0},"p3":{"x":3,"y":4,"rotation":0},"p4":{"x":2,"y":2,"rotation":1},"p5":{"x":4,"y":0,"rotation":3},"p6":{"x":1,"y":4,"rotation":0},"p7":{"x":4,"y":2,"rotation":1},"p8":{"x":0,"y":1,"rotation":1},"p9":{"x":0,"y":3,"rotation":1}}},
  {"cols":6,"rows":6,"blocked":[[0,0],[1,0],[4,0],[5,0],[0,5],[1,5],[4,5],[5,5]],"pieces":[{"id":"p1","kind":"ball"},{"id":"p2","kind":"bag"},{"id":"p3","kind":"plant"},{"id":"p4","kind":"toolbox"},{"id":"p5","kind":"ball"},{"id":"p6","kind":"chair"},{"id":"p7","kind":"bag"},{"id":"p8","kind":"cooler"},{"id":"p9","kind":"chair"}],"solution":{"p1":{"x":2,"y":0,"rotation":0},"p2":{"x":2,"y":4,"rotation":0},"p3":{"x":3,"y":0,"rotation":0},"p4":{"x":5,"y":1,"rotation":1},"p5":{"x":5,"y":4,"rotation":0},"p6":{"x":3,"y":2,"rotation":2},"p7":{"x":0,"y":1,"rotation":0},"p8":{"x":0,"y":3,"rotation":0},"p9":{"x":2,"y":1,"rotation":0}}},
  {"cols":6,"rows":6,"blocked":[[0,0],[5,0]],"pieces":[{"id":"p1","kind":"bag"},{"id":"p2","kind":"tent"},{"id":"p3","kind":"basket"},{"id":"p4","kind":"basket"},{"id":"p5","kind":"plant"},{"id":"p6","kind":"boots"},{"id":"p7","kind":"toolbox"},{"id":"p8","kind":"thermos"},{"id":"p9","kind":"chair"}],"solution":{"p1":{"x":0,"y":4,"rotation":0},"p2":{"x":0,"y":2,"rotation":2},"p3":{"x":0,"y":1,"rotation":2},"p4":{"x":2,"y":4,"rotation":0},"p5":{"x":4,"y":1,"rotation":3},"p6":{"x":3,"y":0,"rotation":1},"p7":{"x":1,"y":0,"rotation":0},"p8":{"x":3,"y":3,"rotation":0},"p9":{"x":4,"y":3,"rotation":2}}},
  {"cols":6,"rows":6,"blocked":[[0,0],[5,0],[0,5],[5,5]],"pieces":[{"id":"p1","kind":"cooler"},{"id":"p2","kind":"toolbox"},{"id":"p3","kind":"thermos"},{"id":"p4","kind":"ball"},{"id":"p5","kind":"basket"},{"id":"p6","kind":"chair"},{"id":"p7","kind":"basket"},{"id":"p8","kind":"cooler"},{"id":"p9","kind":"chair"}],"solution":{"p1":{"x":1,"y":0,"rotation":0},"p2":{"x":0,"y":1,"rotation":1},"p3":{"x":1,"y":5,"rotation":1},"p4":{"x":5,"y":1,"rotation":0},"p5":{"x":4,"y":2,"rotation":3},"p6":{"x":0,"y":3,"rotation":3},"p7":{"x":3,"y":3,"rotation":1},"p8":{"x":3,"y":0,"rotation":0},"p9":{"x":1,"y":2,"rotation":1}}},
  {"cols":6,"rows":6,"blocked":[],"pieces":[{"id":"p1","kind":"chair"},{"id":"p2","kind":"bag"},{"id":"p3","kind":"toolbox"},{"id":"p4","kind":"basket"},{"id":"p5","kind":"boots"},{"id":"p6","kind":"boots"},{"id":"p7","kind":"basket"},{"id":"p8","kind":"toolbox"},{"id":"p9","kind":"rod"}],"solution":{"p1":{"x":0,"y":0,"rotation":0},"p2":{"x":1,"y":0,"rotation":0},"p3":{"x":3,"y":0,"rotation":0},"p4":{"x":0,"y":3,"rotation":1},"p5":{"x":1,"y":4,"rotation":0},"p6":{"x":2,"y":3,"rotation":0},"p7":{"x":4,"y":3,"rotation":3},"p8":{"x":3,"y":1,"rotation":0},"p9":{"x":2,"y":2,"rotation":1}}},
  {"cols":6,"rows":6,"blocked":[[0,0],[5,0],[0,5],[5,5]],"pieces":[{"id":"p1","kind":"bag"},{"id":"p2","kind":"boots"},{"id":"p3","kind":"chair"},{"id":"p4","kind":"bag"},{"id":"p5","kind":"basket"},{"id":"p6","kind":"thermos"},{"id":"p7","kind":"ball"},{"id":"p8","kind":"boots"},{"id":"p9","kind":"rod"}],"solution":{"p1":{"x":1,"y":0,"rotation":0},"p2":{"x":0,"y":4,"rotation":0},"p3":{"x":0,"y":1,"rotation":0},"p4":{"x":3,"y":0,"rotation":0},"p5":{"x":3,"y":2,"rotation":3},"p6":{"x":3,"y":5,"rotation":1},"p7":{"x":2,"y":4,"rotation":0},"p8":{"x":1,"y":2,"rotation":0},"p9":{"x":5,"y":1,"rotation":0}}}
];

export const LEVELS = deepFreeze(LEVEL_LAYOUTS.map((layout, index) => ({
  ...layout,
  id: index + 1,
  title: TITLES[index],
  chapter: CHAPTERS[Math.floor(index / 10)],
})));

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isCoordinate = (value) => Number.isSafeInteger(value);
const keyOf = (x, y) => `${x},${y}`;
const normalizedRotation = (rotation) => ((rotation % 4) + 4) % 4;

/** Return a fresh, top-left-normalized shape after clockwise quarter turns.
 * Accepts a kind string, a level piece ({kind}), or an ITEMS definition ({shape}).
 * Malformed input returns an empty shape rather than throwing during a gesture.
 */
export function cellsFor(pieceOrKind, rotation = 0) {
  if (!Number.isSafeInteger(rotation)) return [];
  const definition = typeof pieceOrKind === 'string'
    ? ITEMS[pieceOrKind]
    : pieceOrKind && (ITEMS[pieceOrKind.kind] || pieceOrKind);
  if (!definition || !Array.isArray(definition.shape) || !definition.shape.length) return [];
  if (!definition.shape.every((cell) => Array.isArray(cell) && cell.length === 2
    && cell.every(isCoordinate))) return [];
  let cells = definition.shape.map(([x, y]) => [x, y]);
  for (let step = 0; step < normalizedRotation(rotation); step += 1) {
    cells = cells.map(([x, y]) => [-y, x]);
  }
  const minX = Math.min(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  return cells.map(([x, y]) => [x - minX, y - minY]);
}

function hasBoard(level) {
  return isRecord(level)
    && Number.isSafeInteger(level.cols) && level.cols > 0 && level.cols <= 32
    && Number.isSafeInteger(level.rows) && level.rows > 0 && level.rows <= 32
    && Array.isArray(level.blocked) && level.blocked.every((cell) => Array.isArray(cell)
      && cell.length === 2 && cell.every(isCoordinate)
      && cell[0] >= 0 && cell[0] < level.cols && cell[1] >= 0 && cell[1] < level.rows)
    && Array.isArray(level.pieces) && level.pieces.length > 0
    && level.pieces.every((piece) => isRecord(piece) && typeof piece.id === 'string'
      && piece.id.length > 0 && Object.hasOwn(ITEMS, piece.kind));
}

function occupiedBy(piece, placement) {
  if (!isRecord(placement) || !isCoordinate(placement.x) || !isCoordinate(placement.y)
    || !Number.isSafeInteger(placement.rotation)) return null;
  const cells = cellsFor(piece, placement.rotation);
  return cells.length ? cells.map(([x, y]) => [x + placement.x, y + placement.y]) : null;
}

/** Test a drop without changing state. The dragged piece's old cells are ignored. */
export function canPlace(level, placements, pieceId, x, y, rotation = 0) {
  if (!hasBoard(level) || !isRecord(placements) || !isCoordinate(x) || !isCoordinate(y)
    || !Number.isSafeInteger(rotation)) return false;
  const piece = level.pieces.find((entry) => entry.id === pieceId);
  if (!piece) return false;
  const occupied = new Set(level.blocked.map(([cx, cy]) => keyOf(cx, cy)));
  for (const [id, placement] of Object.entries(placements)) {
    if (id === pieceId) continue;
    const other = level.pieces.find((entry) => entry.id === id);
    if (!other) return false;
    const cells = occupiedBy(other, placement);
    if (!cells || cells.some(([cx, cy]) => cx < 0 || cy < 0 || cx >= level.cols || cy >= level.rows
      || occupied.has(keyOf(cx, cy)))) return false;
    cells.forEach(([cx, cy]) => occupied.add(keyOf(cx, cy)));
  }
  const candidate = occupiedBy(piece, { x, y, rotation });
  return !!candidate && candidate.every(([cx, cy]) => cx >= 0 && cy >= 0
    && cx < level.cols && cy < level.rows && !occupied.has(keyOf(cx, cy)));
}

/** New state on a legal drop; null on an illegal one. Never mutates the input. */
export function placePiece(level, placements, pieceId, x, y, rotation = 0) {
  if (!canPlace(level, placements, pieceId, x, y, rotation)) return null;
  return { ...placements, [pieceId]: { x, y, rotation: normalizedRotation(rotation) } };
}

export function removePiece(placements, pieceId) {
  const result = isRecord(placements) ? { ...placements } : {};
  delete result[pieceId];
  return result;
}

/** Completion accepts every legal packing, not just the stored canonical one. */
export function isSolved(level, placements) {
  if (!hasBoard(level) || !isRecord(placements)
    || Object.keys(placements).length !== level.pieces.length) return false;
  const cells = new Set();
  for (const piece of level.pieces) {
    const p = placements[piece.id];
    if (!p || !canPlace(level, placements, piece.id, p.x, p.y, p.rotation)) return false;
    occupiedBy(piece, p).forEach(([x, y]) => cells.add(keyOf(x, y)));
  }
  return cells.size === level.cols * level.rows - new Set(level.blocked.map(([x, y]) => keyOf(x, y))).size;
}

function sameCells(piece, a, b) {
  const left = occupiedBy(piece, a);
  const right = occupiedBy(piece, b);
  if (!left || !right || left.length !== right.length) return false;
  const keys = new Set(left.map(([x, y]) => keyOf(x, y)));
  return right.every(([x, y]) => keys.has(keyOf(x, y)));
}

/** A deterministic recoverable hint, including pieces to return to the tray.
 * It prioritizes unpacked pieces. Repeated hints converge on a valid packing.
 * clearIds must be removed before placing the returned target.
 */
export function findHint(level, placements) {
  if (!hasBoard(level) || !isRecord(placements) || !isRecord(level.solution)
    || !isSolved(level, level.solution) || isSolved(level, placements)) return null;
  const candidates = level.pieces.filter((piece) => !sameCells(piece, placements[piece.id], level.solution[piece.id]));
  const piece = candidates.find((entry) => !Object.hasOwn(placements, entry.id)) || candidates[0];
  if (!piece) return null;
  const target = level.solution[piece.id];
  const targetCells = new Set(occupiedBy(piece, target).map(([x, y]) => keyOf(x, y)));
  const clearIds = [];
  for (const [id, placement] of Object.entries(placements)) {
    if (id === piece.id) continue;
    const other = level.pieces.find((entry) => entry.id === id);
    const cells = other && occupiedBy(other, placement);
    if (!cells || cells.some(([x, y]) => targetCells.has(keyOf(x, y)))) clearIds.push(id);
  }
  return { pieceId: piece.id, x: target.x, y: target.y, rotation: target.rotation, clearIds };
}

/** Validate content supplied by a level editor or loaded from storage. */
export function validateLevel(level) {
  const errors = [];
  if (!hasBoard(level)) return { valid: false, errors: ['Некорректное поле или список предметов.'] };
  const blocked = new Set(level.blocked.map(([x, y]) => keyOf(x, y)));
  if (blocked.size !== level.blocked.length) errors.push('Заблокированные клетки повторяются.');
  const ids = level.pieces.map((piece) => piece.id);
  if (new Set(ids).size !== ids.length) errors.push('Идентификаторы предметов повторяются.');
  const area = level.pieces.reduce((sum, piece) => sum + cellsFor(piece).length, 0);
  if (area !== level.cols * level.rows - blocked.size) errors.push('Площадь предметов не совпадает с площадью багажника.');
  if (!isRecord(level.solution) || !isSolved(level, level.solution)) errors.push('Отсутствует корректное решение уровня.');
  return { valid: errors.length === 0, errors };
}
