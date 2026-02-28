export type PacketSize = 'M' | 'MS' | 'S';

export interface FoodPacket {
  id: string;
  name: string;
  calories: number;
  weightKg: number;
  size: PacketSize;
  price: number;
  image?: string;
  modalImage?: string;
}

export interface ContainerType {
  id: string;
  name: string;
  mCapacity: number; // capacity in M units
  extraSCapacity: number; // some containers have extra space for S packets
  description: string;
  price: number;
  icon: string;
}

export interface PackedContainer {
  id: string;
  containerTypeId: string;
  packetIds: string[]; // List of packet IDs. We'll need to validate they fit.
}

export interface SurvivalPlan {
  durationDays: number;
  peopleCount: number;
  dailyCaloriesPerPerson: number;
  packedContainers: PackedContainer[];
}
