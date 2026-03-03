// Last price update: 04.03.2026, 01:47:48
import { FoodPacket, ContainerType } from './types';

// Unit system: M = 6, MS = 2, S = 1
export const SIZE_UNITS = {
  M: 6,
  MS: 2,
  S: 1
};

export const FOOD_PACKETS: FoodPacket[] = [
  { id: 'buckwheat', name: 'Гречка', calories: 9089, weightKg: 2.65, size: 'M', price: 530, image: `${import.meta.env.BASE_URL}/images/гречка.webp`, modalImage: `${import.meta.env.BASE_URL}/images/гречка-l.webp` },
  { id: 'rice', name: 'Рис', calories: 8824, weightKg: 2.65, size: 'M', price: 810, image: `${import.meta.env.BASE_URL}/images/рис.webp`, modalImage: `${import.meta.env.BASE_URL}/images/рис-l.webp` },
  { id: 'millet', name: 'Пшено', calories: 9063, weightKg: 2.65, size: 'M', price: 540, image: `${import.meta.env.BASE_URL}/images/пшено.webp`, modalImage: `${import.meta.env.BASE_URL}/images/пшено-l.webp` },
  { id: 'oatmeal', name: 'Овсянка', calories: 5780, weightKg: 1.7, size: 'M', price: 540, image: `${import.meta.env.BASE_URL}/images/овсянка.webp`, modalImage: `${import.meta.env.BASE_URL}/images/овсянка-l.webp` },
  { id: 'sugar', name: 'Сахар', calories: 11542, weightKg: 2.9, size: 'M', price: 680, image: `${import.meta.env.BASE_URL}/images/сахар.webp`, modalImage: `${import.meta.env.BASE_URL}/images/сахар-l.webp` },
  { id: 'beans', name: 'Фасоль', calories: 8658, weightKg: 2.6, size: 'M', price: 1440, image: `${import.meta.env.BASE_URL}/images/фасоль.webp`, modalImage: `${import.meta.env.BASE_URL}/images/фасоль-l.webp` },
  { id: 'chickpeas', name: 'Нут', calories: 9464, weightKg: 2.6, size: 'M', price: 1110, image: `${import.meta.env.BASE_URL}/images/нут.webp`, modalImage: `${import.meta.env.BASE_URL}/images/нут-l.webp` },
  { id: 'lentils', name: 'Чечевица', calories: 8075, weightKg: 2.5, size: 'M', price: 1060,  image: `${import.meta.env.BASE_URL}/images/чечевица.webp`, modalImage: `${import.meta.env.BASE_URL}/images/чечевица-l.webp` },
  { id: 'pasta_standard', name: 'Макароны рожки', calories: 5100, weightKg: 1.5, size: 'M', price: 750, image: `${import.meta.env.BASE_URL}/images/рожки.webp`, modalImage: `${import.meta.env.BASE_URL}/images/рожки-l.webp` },
  { id: 'peas', name: 'Горох', calories: 7748, weightKg: 2.6, size: 'M', price: 740, image:  `${import.meta.env.BASE_URL}/images/горох.webp` },
  { id: 'pork', name: 'Свинина сублимированная', calories: 1304, weightKg: 0.2, size: 'MS', price: 2300, image: `${import.meta.env.BASE_URL}/images/свинина.webp`, modalImage: `${import.meta.env.BASE_URL}/images/свинина-l.webp` },
  { id: 'ptitim', name: 'Макароны птитим', calories: 2275, weightKg: 0.65, size: 'MS', price: 570, image: `${import.meta.env.BASE_URL}/images/птитим.webp`, modalImage: `${import.meta.env.BASE_URL}/images/птитим-l.webp` },
  { id: 'pepper', name: 'Перец', calories: 632, weightKg: 0.18, size: 'S', price: 660, image: `${import.meta.env.BASE_URL}/images/перец.webp`, modalImage: `${import.meta.env.BASE_URL}/images/перец-l.webp` },
  { id: 'coffee', name: 'Кофе сублимированный', calories: 94, weightKg: 0.1, size: 'S', price: 710, image: `${import.meta.env.BASE_URL}/images/кофе.webp`, modalImage: `${import.meta.env.BASE_URL}/images/кофе-l.webp` },
  { id: 'salt', name: 'Соль морская', calories: 0, weightKg: 0.3, size: 'S', price: 310, image: `${import.meta.env.BASE_URL}/images/соль.webp`, modalImage: `${import.meta.env.BASE_URL}/images/соль.webp` },
];

export const CONTAINER_TYPES: ContainerType[] = [
  { 
    id: 'box', 
    name: 'Коробка', 
    mCapacity: 4, 
    extraSCapacity: 0,
    price: 180,
    description: '4 пакета (размер M)',
    icon: `${import.meta.env.BASE_URL}/images/box4.webp`
  },
  { 
    id: 'household', 
    name: 'Контейнер бытовой', 
    mCapacity: 10, 
    extraSCapacity: 5,
    price: 2700,
    description: '10 пакетов M + 5 пакетов S',
    icon: `${import.meta.env.BASE_URL}/images/box1.webp`
  },
  { 
    id: 'expedition', 
    name: 'Контейнер экспедиционный', 
    mCapacity: 9, 
    extraSCapacity: 0,
    price: 2700,
    description: '9 пакетов (размер M)',
    icon: `${import.meta.env.BASE_URL}/images/box2.webp`
  },
  { 
    id: 'crate', 
    name: 'Ящик деревянный', 
    mCapacity: 8, 
    extraSCapacity: 0,
    price: 3720,
    description: '8 пакетов (размер M)',
    icon: `${import.meta.env.BASE_URL}/images/box3.webp`
  },
];

export const DEFAULT_DAILY_CALORIES = 2000;
