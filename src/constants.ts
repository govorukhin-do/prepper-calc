import { FoodPacket, ContainerType } from './types';

// Unit system: M = 6, MS = 2, S = 1
export const SIZE_UNITS = {
  M: 6,
  MS: 2,
  S: 1
};

export const FOOD_PACKETS: FoodPacket[] = [
  { id: 'buckwheat', name: 'Гречка', calories: 9089, weightKg: 2.65, size: 'M', price: 590, image: 'https://picsum.photos/seed/buckwheat/200/200' },
  { id: 'millet', name: 'Пшено', calories: 9063, weightKg: 2.65, size: 'M', price: 650, image: 'https://picsum.photos/seed/millet/200/200' },
  { id: 'oatmeal', name: 'Овсянка', calories: 5780, weightKg: 1.7, size: 'M', price: 600, image: 'https://picsum.photos/seed/oatmeal/200/200' },
  { id: 'rice', name: 'Рис', calories: 8824, weightKg: 2.65, size: 'M', price: 880, image: 'https://picsum.photos/seed/rice/200/200' },
  { id: 'sugar', name: 'Сахар', calories: 11542, weightKg: 2.9, size: 'M', price: 750, image: 'https://picsum.photos/seed/sugar/200/200' },
  { id: 'beans', name: 'Фасоль', calories: 8658, weightKg: 2.6, size: 'M', price: 1550, image: 'https://picsum.photos/seed/beans/200/200' },
  { id: 'chickpeas', name: 'Нут', calories: 9464, weightKg: 2.6, size: 'M', price: 1200, image: 'https://picsum.photos/seed/chickpeas/200/200' },
  { id: 'lentils', name: 'Чечевица', calories: 8075, weightKg: 2.5, size: 'M', price: 1200, image: 'https://picsum.photos/seed/lentils/200/200' },
  { id: 'pasta_premium', name: 'Макароны La Molisana', calories: 5089, weightKg: 1.45, size: 'M', price: 1500, image: 'https://picsum.photos/seed/pasta1/200/200' },
  { id: 'pasta_standard', name: 'Макароны рожки', calories: 5100, weightKg: 1.5, size: 'M', price: 850, image: 'https://picsum.photos/seed/pasta2/200/200' },
  { id: 'ptitim', name: 'Макароны птитим', calories: 2275, weightKg: 0.65, size: 'MS', price: 600, image: 'https://picsum.photos/seed/ptitim/200/200' },
  { id: 'pork', name: 'Свинина сублим.', calories: 1304, weightKg: 0.2, size: 'MS', price: 2300, image: 'https://picsum.photos/seed/pork/200/200' },
  { id: 'peas', name: 'Горох', calories: 7748, weightKg: 2.6, size: 'M', price: 770, image: 'https://picsum.photos/seed/peas/200/200' },
  { id: 'pepper', name: 'Перец', calories: 632, weightKg: 0.18, size: 'S', price: 700, image: 'https://picsum.photos/seed/pepper/200/200' },
  { id: 'coffee', name: 'Кофе сублим.', calories: 94, weightKg: 0.1, size: 'S', price: 750, image: 'https://picsum.photos/seed/coffee/200/200' },
  { id: 'salt', name: 'Соль морская', calories: 0, weightKg: 0.35, size: 'S', price: 300, image: 'https://picsum.photos/seed/salt/200/200' },
];

export const CONTAINER_TYPES: ContainerType[] = [
  { 
    id: 'box', 
    name: 'Коробка', 
    mCapacity: 4, 
    extraSCapacity: 0,
    price: 100,
    description: '4 пакета (размер M)',
    icon: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: 'household', 
    name: 'Контейнер бытовой', 
    mCapacity: 10, 
    extraSCapacity: 5,
    price: 2700,
    description: '10 пакетов M + 5 пакетов S',
    icon: 'https://images.unsplash.com/photo-1591193583824-1b7038a7919b?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: 'expedition', 
    name: 'Контейнер экспедиционный', 
    mCapacity: 9, 
    extraSCapacity: 0,
    price: 6800,
    description: '9 пакетов (размер M)',
    icon: 'https://images.unsplash.com/photo-1521331869997-29e24744e073?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: 'crate', 
    name: 'Ящик деревянный', 
    mCapacity: 8, 
    extraSCapacity: 0,
    price: 5200,
    description: '8 пакетов (размер M)',
    icon: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&q=80&w=800'
  },
];

export const DEFAULT_DAILY_CALORIES = 2000;
