import { FoodPacket, ContainerType } from './types';

// Unit system: M = 6, MS = 2, S = 1
export const SIZE_UNITS = {
  M: 6,
  MS: 2,
  S: 1
};

export const FOOD_PACKETS: FoodPacket[] = [
  { id: 'buckwheat', name: 'Гречка', calories: 9089, weightKg: 2.65, size: 'M', price: 590, image: '/prepper-calc/images/гречка.webp', modalImage: '/prepper-calc/images/гречка-l.webp' },
  { id: 'rice', name: 'Рис', calories: 8824, weightKg: 2.65, size: 'M', price: 880, image: '/prepper-calc/images/рис.webp', modalImage: '/prepper-calc/images/рис-l.webp' },
  { id: 'millet', name: 'Пшено', calories: 9063, weightKg: 2.65, size: 'M', price: 650, image: '/prepper-calc/images/пшено.webp', modalImage: '/prepper-calc/images/пшено-l.webp' },
  { id: 'oatmeal', name: 'Овсянка', calories: 5780, weightKg: 1.7, size: 'M', price: 600, image: '/prepper-calc/images/овсянка.webp', modalImage: '/prepper-calc/images/овсянка-l.webp' },
  { id: 'sugar', name: 'Сахар', calories: 11542, weightKg: 2.9, size: 'M', price: 750, image: '/prepper-calc/images/сахар.webp', modalImage: '/prepper-calc/images/сахар-l.webp' },
  { id: 'beans', name: 'Фасоль', calories: 8658, weightKg: 2.6, size: 'M', price: 1550, image: '/prepper-calc/images/фасоль.webp', modalImage: '/prepper-calc/images/фасоль-l.webp' },
  { id: 'chickpeas', name: 'Нут', calories: 9464, weightKg: 2.6, size: 'M', price: 1200, image: '/prepper-calc/images/нут.webp', modalImage: '/prepper-calc/images/нут-l.webp' },
  { id: 'lentils', name: 'Чечевица', calories: 8075, weightKg: 2.5, size: 'M', price: 1200,  image: '/prepper-calc/images/чечевица.webp', modalImage: '/prepper-calc/images/чечевица-l.webp' },
  { id: 'pasta_standard', name: 'Макароны рожки', calories: 5100, weightKg: 1.5, size: 'M', price: 850, image: '/prepper-calc/images/рожки.webp', modalImage: '/prepper-calc/images/рожки-l.webp' },
  { id: 'ptitim', name: 'Макароны птитим', calories: 2275, weightKg: 0.65, size: 'MS', price: 600, image: 'https://picsum.photos/seed/ptitim/200/200', modalImage: 'https://picsum.photos/seed/ptitim/800/600' },
  { id: 'pork', name: 'Свинина сублим.', calories: 1304, weightKg: 0.2, size: 'MS', price: 2300, image: 'https://picsum.photos/seed/pork/200/200', modalImage: 'https://picsum.photos/seed/pork/800/600' },
  { id: 'peas', name: 'Горох', calories: 7748, weightKg: 2.6, size: 'M', price: 770, image: 'https://picsum.photos/seed/peas/200/200', modalImage: 'https://picsum.photos/seed/peas/800/600' },
  { id: 'pepper', name: 'Перец', calories: 632, weightKg: 0.18, size: 'S', price: 700, image: 'https://picsum.photos/seed/pepper/200/200', modalImage: 'https://picsum.photos/seed/pepper/800/600' },
  { id: 'coffee', name: 'Кофе сублим.', calories: 94, weightKg: 0.1, size: 'S', price: 750, image: 'https://picsum.photos/seed/coffee/200/200', modalImage: 'https://picsum.photos/seed/coffee/800/600' },
  { id: 'salt', name: 'Соль морская', calories: 0, weightKg: 0.35, size: 'S', price: 300, image: 'https://picsum.photos/seed/salt/200/200', modalImage: 'https://picsum.photos/seed/salt/800/600' },
];

export const CONTAINER_TYPES: ContainerType[] = [
  { 
    id: 'box', 
    name: 'Коробка', 
    mCapacity: 4, 
    extraSCapacity: 0,
    price: 100,
    description: '4 пакета (размер M)',
    icon: '/prepper-calc/images/box4.webp'
  },
  { 
    id: 'household', 
    name: 'Контейнер бытовой', 
    mCapacity: 10, 
    extraSCapacity: 5,
    price: 2700,
    description: '10 пакетов M + 5 пакетов S',
    icon: '/prepper-calc/images/box1.webp'
  },
  { 
    id: 'expedition', 
    name: 'Контейнер экспедиционный', 
    mCapacity: 9, 
    extraSCapacity: 0,
    price: 6800,
    description: '9 пакетов (размер M)',
    icon: '/prepper-calc/images/box2.webp'
  },
  { 
    id: 'crate', 
    name: 'Ящик деревянный', 
    mCapacity: 8, 
    extraSCapacity: 0,
    price: 5200,
    description: '8 пакетов (размер M)',
    icon: '/prepper-calc/images/box3.webp'
  },
];

export const DEFAULT_DAILY_CALORIES = 2000;
