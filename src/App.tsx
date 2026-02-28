import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, 
  Archive, 
  Container as ContainerIcon, 
  Plus, 
  Minus, 
  Trash2, 
  Calculator, 
  Package, 
  Info,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Zap,
  Settings,
  X,
  Search,
  Maximize2,
  MessageSquare,
  Phone,
  Mail,
  User
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { FOOD_PACKETS, CONTAINER_TYPES, DEFAULT_DAILY_CALORIES, SIZE_UNITS } from './constants';
import { FoodPacket, ContainerType, PackedContainer, PacketSize } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper for Russian declension
const declension = (count: number, titles: [string, string, string]) => {
  const cases = [2, 0, 1, 1, 1, 2];
  return titles[count % 100 > 4 && count % 100 < 20 ? 2 : cases[Math.min(count % 10, 5)]];
};

const formatDuration = (days: number) => {
  if (days < 7) return `${days}\u00A0${declension(days, ['день', 'дня', 'дней'])}`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks}\u00A0${declension(weeks, ['неделя', 'недели', 'недель'])}`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months}\u00A0${declension(months, ['месяц', 'месяца', 'месяцев'])}`;
  }
  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days % 365) / 30);
  
  let result = `${years}\u00A0${declension(years, ['год', 'года', 'лет'])}`;
  if (remainingMonths > 0) {
    result += `\u00A0и ${remainingMonths}\u00A0${declension(remainingMonths, ['месяц', 'месяца', 'месяцев'])}`;
  }
  return result;
};

const formatDurationPrecise = (days: number) => {
  if (days === 0) return '0 дней';
  const years = Math.floor(days / 365);
  let remainder = days % 365;
  const months = Math.floor(remainder / 30);
  remainder = remainder % 30;
  const weeks = Math.floor(remainder / 7);
  const d = remainder % 7;

  const parts = [];
  if (years > 0) parts.push(`${years}\u00A0${declension(years, ['год', 'года', 'лет'])}`);
  if (months > 0) parts.push(`${months}\u00A0${declension(months, ['месяц', 'месяца', 'месяцев'])}`);
  if (parts.length < 2 && weeks > 0) parts.push(`${weeks}\u00A0${declension(weeks, ['неделя', 'недели', 'недель'])}`);
  if (parts.length < 2 && d > 0) parts.push(`${d}\u00A0${declension(d, ['день', 'дня', 'дней'])}`);
  
  return parts.slice(0, 2).join('\u00A0и ') || `${days}\u00A0${declension(days, ['день', 'дня', 'дней'])}`;
};

// Slider mapping logic
const SLIDER_STEPS = [
  { label: '1 нед', days: 7 },
  { label: '2 нед', days: 14 },
  { label: '3 нед', days: 21 },
  ...Array.from({ length: 11 }, (_, i) => {
    const months = i + 1;
    return { label: `${months} ${declension(months, ['мес', 'мес', 'мес'])}`, days: months * 30 };
  }),
  ...Array.from({ length: 9 }, (_, i) => {
    const years = 1 + i * 0.5;
    const isFractional = years % 1 !== 0;
    const word = isFractional ? 'года' : declension(years, ['год', 'года', 'лет']);
    return { label: `${years} ${word}`, days: Math.round(years * 365) };
  }),
  ...Array.from({ length: 15 }, (_, i) => {
    const years = 6 + i;
    return { label: `${years} ${declension(years, ['год', 'года', 'лет'])}`, days: years * 365 };
  }),
];

interface AutoPoolItem {
  packetId: string;
  proportion: number;
}

const getDynamicFontSize = (text: string, maxRem: number, minRem: number, vwBase: number) => {
  const baseLength = 8;
  const factor = Math.max(1, text.length / baseLength);
  return `clamp(${minRem}rem, ${vwBase / factor}vw, ${maxRem / factor}rem)`;
};

export default function App() {
  const [sliderIndex, setSliderIndex] = useState(3); // Default 1 month
  const [peopleCount, setPeopleCount] = useState(1);
  const [dailyCalories, setDailyCalories] = useState(DEFAULT_DAILY_CALORIES);
  
  const [packMode, setPackMode] = useState<'auto' | 'manual'>('auto');
  
  // Manual mode state
  const [packedContainers, setPackedContainers] = useState<PackedContainer[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Auto mode state
  const [autoPool, setAutoPool] = useState<AutoPoolItem[]>([
    { packetId: 'buckwheat', proportion: 10 }
  ]);
  const [autoContainerId, setAutoContainerId] = useState<string>(CONTAINER_TYPES[0].id);
  const [autoMix, setAutoMix] = useState(true);
  const [manualAutoContainers, setManualAutoContainers] = useState<PackedContainer[] | null>(null);

  const [activeTab, setActiveTab] = useState<'calc' | 'pack' | 'summary'>('calc');

  // UI State
  const [zoomImage, setZoomImage] = useState<{ url: string, title: string, desc?: string } | null>(null);
  const [showOrderForm, setShowOrderForm] = useState<'order' | 'consult' | null>(null);
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [isBoxSelectorOpen, setIsBoxSelectorOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const [isSticky, setIsSticky] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const durationDays = SLIDER_STEPS[sliderIndex].days;

  // Calculations
  const totalCaloriesNeeded = useMemo(() => {
    return durationDays * peopleCount * dailyCalories;
  }, [durationDays, peopleCount, dailyCalories]);

  // Auto-pack logic
  const autoGeneratedContainers = useMemo(() => {
    if (autoPool.length === 0) return [];
    
    const totalProp = autoPool.reduce((sum, item) => sum + item.proportion, 0);
    if (totalProp === 0) return [];

    let weightedCalories = 0;
    autoPool.forEach(item => {
      const packet = FOOD_PACKETS.find(p => p.id === item.packetId)!;
      weightedCalories += (item.proportion / totalProp) * packet.calories;
    });
    
    if (weightedCalories === 0) return [];
    
    const totalPacketsNeeded = totalCaloriesNeeded / weightedCalories;
    
    let packetsToPack: string[] = [];
    autoPool.forEach(item => {
      const count = Math.round((item.proportion / totalProp) * totalPacketsNeeded);
      for (let i = 0; i < count; i++) {
        packetsToPack.push(item.packetId);
      }
    });
    
    const containerType = CONTAINER_TYPES.find(t => t.id === autoContainerId)!;
    const maxMUnits = containerType.mCapacity * 6;
    const maxSUnits = containerType.extraSCapacity;
    
    if (!autoMix) {
      packetsToPack.sort();
    } else {
      // Simple deterministic shuffle based on index to mix them evenly
      const mixed: string[] = [];
      const pools = autoPool.map(p => packetsToPack.filter(id => id === p.packetId));
      let hasMore = true;
      while(hasMore) {
        hasMore = false;
        for (const pool of pools) {
          if (pool.length > 0) {
            mixed.push(pool.pop()!);
            hasMore = true;
          }
        }
      }
      packetsToPack = mixed;
    }
    
    const containers: PackedContainer[] = [];
    let currentContainer: PackedContainer = {
      id: Math.random().toString(36).substr(2, 9),
      containerTypeId: autoContainerId,
      packetIds: []
    };
    let currentMUnits = 0;
    let currentSUnits = 0;
    
    for (const pId of packetsToPack) {
      const p = FOOD_PACKETS.find(pkt => pkt.id === pId)!;
      const units = SIZE_UNITS[p.size];
      
      let fits = false;
      if (p.size === 'S') {
        if (currentSUnits < maxSUnits) {
          currentSUnits += 1;
          fits = true;
        } else if (currentMUnits + units <= maxMUnits) {
          currentMUnits += units;
          fits = true;
        }
      } else {
        if (currentMUnits + units <= maxMUnits) {
          currentMUnits += units;
          fits = true;
        }
      }
      
      if (fits) {
        currentContainer.packetIds.push(pId);
      } else {
        containers.push(currentContainer);
        currentContainer = {
          id: Math.random().toString(36).substr(2, 9),
          containerTypeId: autoContainerId,
          packetIds: [pId]
        };
        if (p.size === 'S') {
          currentSUnits = 1;
          currentMUnits = 0;
        } else {
          currentSUnits = 0;
          currentMUnits = units;
        }
      }
    }
    if (currentContainer.packetIds.length > 0) {
      containers.push(currentContainer);
    }
    
    return containers;
  }, [autoPool, autoContainerId, autoMix, totalCaloriesNeeded]);

  const activeContainers = useMemo(() => {
    if (packMode === 'auto') {
      return manualAutoContainers || autoGeneratedContainers;
    }
    return packedContainers;
  }, [packMode, manualAutoContainers, autoGeneratedContainers, packedContainers]);

  const currentCaloriesPacked = useMemo(() => {
    return activeContainers.reduce((total, container) => {
      return total + container.packetIds.reduce((cTotal, pId) => {
        const packet = FOOD_PACKETS.find(p => p.id === pId);
        return cTotal + (packet?.calories || 0);
      }, 0);
    }, 0);
  }, [activeContainers]);

  const packedDurationDays = useMemo(() => {
    if (peopleCount === 0 || dailyCalories === 0) return 0;
    return Math.floor(currentCaloriesPacked / (peopleCount * dailyCalories));
  }, [currentCaloriesPacked, peopleCount, dailyCalories]);

  const progress = Math.min((currentCaloriesPacked / totalCaloriesNeeded) * 100, 100);

  const groupedAutoContainers = useMemo(() => {
    const groups: { [key: string]: { container: PackedContainer, count: number, ids: string[] } } = {};
    activeContainers.forEach(c => {
      const key = `${c.containerTypeId}-${[...c.packetIds].sort().join(',')}`;
      if (!groups[key]) {
        groups[key] = { container: c, count: 0, ids: [] };
      }
      groups[key].count++;
      groups[key].ids.push(c.id);
    });
    return Object.values(groups);
  }, [activeContainers]);

  // Manual Handlers
  const addContainer = (typeId: string) => {
    const newContainer: PackedContainer = {
      id: Math.random().toString(36).substr(2, 9),
      containerTypeId: typeId,
      packetIds: []
    };
    setPackedContainers([...packedContainers, newContainer]);
  };

  const removeContainer = (id: string) => {
    if (packMode === 'auto') {
      const current = manualAutoContainers || autoGeneratedContainers;
      setManualAutoContainers(current.filter(c => c.id !== id));
    } else {
      setPackedContainers(packedContainers.filter(c => c.id !== id));
    }
  };

  const addPacketToContainer = (containerId: string, packetId: string) => {
    const update = (containers: PackedContainer[]) => containers.map(c => {
      if (c.id === containerId) {
        const type = CONTAINER_TYPES.find(t => t.id === c.containerTypeId)!;
        const packet = FOOD_PACKETS.find(p => p.id === packetId)!;
        
        const currentUnits = c.packetIds.reduce((acc, pId) => acc + SIZE_UNITS[FOOD_PACKETS.find(pkt => pkt.id === pId)!.size], 0);
        const maxUnits = type.mCapacity * 6 + type.extraSCapacity;
        
        if (currentUnits + SIZE_UNITS[packet.size] <= maxUnits) {
          return { ...c, packetIds: [...c.packetIds, packetId] };
        }
      }
      return c;
    });

    if (packMode === 'auto') {
      setManualAutoContainers(update(manualAutoContainers || autoGeneratedContainers));
    } else {
      setPackedContainers(update(packedContainers));
    }
    setActiveDropdown(null);
  };

  const addPacketToFirstAvailable = (packetId: string) => {
    const packet = FOOD_PACKETS.find(p => p.id === packetId)!;
    const unitsNeeded = SIZE_UNITS[packet.size];
    
    let targetContainerId: string | null = null;
    
    for (const c of packedContainers) {
      const type = CONTAINER_TYPES.find(t => t.id === c.containerTypeId)!;
      const currentUnits = c.packetIds.reduce((acc, pId) => acc + SIZE_UNITS[FOOD_PACKETS.find(pkt => pkt.id === pId)!.size], 0);
      const maxUnits = type.mCapacity * 6 + type.extraSCapacity;
      if (currentUnits + unitsNeeded <= maxUnits) {
        targetContainerId = c.id;
        break;
      }
    }

    if (targetContainerId) {
      addPacketToContainer(targetContainerId, packetId);
    } else {
      // Add new box and put packet in it
      const newBoxId = Math.random().toString(36).substr(2, 9);
      const newContainer: PackedContainer = {
        id: newBoxId,
        containerTypeId: 'box',
        packetIds: [packetId]
      };
      setPackedContainers([...packedContainers, newContainer]);
    }
  };

  const removePacketFromContainer = (containerId: string, packetIndex: number) => {
    setPackedContainers(packedContainers.map(c => {
      if (c.id === containerId) {
        const newPackets = [...c.packetIds];
        newPackets.splice(packetIndex, 1);
        return { ...c, packetIds: newPackets };
      }
      return c;
    }));
  };

  const removePacketFromContainerByPId = (containerId: string, packetId: string) => {
    const update = (containers: PackedContainer[]) => containers.map(c => {
      if (c.id === containerId) {
        const index = c.packetIds.lastIndexOf(packetId);
        if (index > -1) {
          const newPackets = [...c.packetIds];
          newPackets.splice(index, 1);
          return { ...c, packetIds: newPackets };
        }
      }
      return c;
    });

    if (packMode === 'auto') {
      setManualAutoContainers(update(manualAutoContainers || autoGeneratedContainers));
    } else {
      setPackedContainers(update(packedContainers));
    }
  };

  const resetAutoContainers = () => {
    setManualAutoContainers(null);
  };

  // Auto Handlers
  const toggleAutoPoolItem = (packetId: string) => {
    if (autoPool.find(p => p.packetId === packetId)) {
      setAutoPool(autoPool.filter(p => p.packetId !== packetId));
    } else {
      setAutoPool([...autoPool, { packetId, proportion: 10 }]);
    }
  };

  const updateAutoPoolProportion = (packetId: string, proportion: number) => {
    setAutoPool(autoPool.map(p => p.packetId === packetId ? { ...p, proportion } : p));
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Box': return <Box className="w-6 h-6" />;
      case 'Archive': return <Archive className="w-6 h-6" />;
      case 'Container': return <ContainerIcon className="w-6 h-6" />;
      case 'Shield': return <Shield className="w-6 h-6" />;
      default: return <Package className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-tactical-bg text-tactical-text tactical-grid pb-20">
      {/* Header */}
      <header className="border-b border-tactical-border bg-tactical-bg/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tactical-accent rounded flex items-center justify-center">
              <Shield className="text-tactical-bg w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-lg tracking-tight uppercase leading-tight">Стратегический запас продуктов</h1>
              <p className="text-[10px] font-mono text-tactical-muted uppercase tracking-widest">Калькулятор</p>
            </div>
          </div>
          
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-tactical-border w-full">
          <motion.div 
            className="h-full bg-tactical-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-tactical-card p-1 rounded-lg border border-tactical-border">
          {[
            { id: 'calc', label: '1. Расчет', icon: Calculator },
            { id: 'pack', label: '2. Сборка', icon: Package },
            { id: 'summary', label: '3. Итог', icon: CheckCircle2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-4 rounded-md transition-all font-mono text-[10px] sm:text-xs uppercase tracking-wider cursor-pointer whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-tactical-accent text-tactical-bg font-bold" 
                  : "hover:bg-tactical-border text-tactical-muted"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'calc' && (
            <motion.div 
              key="calc"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 gap-8"
            >
              <div className="space-y-6">
                <section className="bg-tactical-card border border-tactical-border rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Calculator className="text-tactical-accent" />
                    Параметры запаса
                  </h2>
                  
                  <div className="space-y-10">
                    <div id="duration-slider">
                      <div className="flex justify-between items-end mb-4">
                        <label className="text-xs font-mono text-tactical-muted uppercase">Срок автономности</label>
                        <span className="font-mono text-xl font-bold text-tactical-accent">
                          {SLIDER_STEPS[sliderIndex].label}
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max={SLIDER_STEPS.length - 1} 
                        step="1"
                        value={sliderIndex} 
                        onChange={(e) => setSliderIndex(parseInt(e.target.value))}
                        className="w-full accent-tactical-accent h-2 bg-tactical-border rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between mt-2 text-[10px] font-mono text-tactical-muted uppercase">
                        <span className="cursor-pointer hover:text-tactical-text transition-colors" onClick={() => setDurationDays(7)}>1 нед</span>
                        <span>1 год</span>
                        <span className="cursor-pointer hover:text-tactical-text transition-colors" onClick={() => setDurationDays(7300)}>20 лет</span>
                      </div>
                    </div>

                    <div id="people-count">
                      <label className="block text-xs font-mono text-tactical-muted uppercase mb-4">Количество человек</label>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                          className="p-3 border border-tactical-border rounded-lg hover:bg-tactical-accent hover:text-tactical-bg transition-colors cursor-pointer"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="flex-1 text-center font-mono text-3xl font-bold">{peopleCount}</span>
                        <button 
                          onClick={() => setPeopleCount(peopleCount + 1)}
                          className="p-3 border border-tactical-border rounded-lg hover:bg-tactical-accent hover:text-tactical-bg transition-colors cursor-pointer"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-tactical-muted uppercase mb-4">Суточный рацион</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { val: 1500, label: 'Режим экономии', desc: 'Минимум для выживания' },
                          { val: 2000, label: 'Стандарт', desc: 'Обычная активность' },
                          { val: 2500, label: 'Активный', desc: 'Повышенные нагрузки' },
                          { val: 3000, label: 'Тяжелый труд', desc: 'Максимальный расход' }
                        ].map(item => (
                          <button
                            key={item.val}
                            onClick={() => setDailyCalories(item.val)}
                            className={cn(
                              "p-3 rounded-lg border text-left transition-all flex flex-col gap-1 cursor-pointer",
                              dailyCalories === item.val 
                                ? "bg-tactical-accent/10 border-tactical-accent" 
                                : "bg-tactical-bg border-tactical-border hover:border-tactical-muted"
                            )}
                          >
                            <div className="flex flex-wrap justify-between items-start w-full gap-x-2 gap-y-1">
                              <span className={cn("font-bold text-sm leading-tight", dailyCalories === item.val ? "text-tactical-accent" : "text-tactical-text")}>{item.label}</span>
                              <span className="font-mono text-xs text-tactical-muted whitespace-nowrap mt-0.5">{item.val} ККАЛ</span>
                            </div>
                            <span className="text-[10px] text-tactical-muted">{item.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="bg-tactical-card border border-tactical-border rounded-xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Zap className="w-32 h-32 text-tactical-accent" />
                  </div>
                  
                  <h3 className="text-sm font-mono text-tactical-muted uppercase tracking-widest mb-2">Необходимый запас энергии</h3>
                  <div 
                    className="font-black mb-4 tracking-tighter text-tactical-accent whitespace-nowrap max-w-full px-2"
                    style={{ fontSize: getDynamicFontSize(totalCaloriesNeeded.toLocaleString(), 3.75, 1.5, 8) }}
                  >
                    {totalCaloriesNeeded.toLocaleString()}
                    <span className="text-[clamp(0.875rem,4vw,1.25rem)] ml-2 opacity-50">ККАЛ</span>
                  </div>
                  
                  <div className="w-full h-px bg-tactical-border my-6" />
                  
                  <div className="grid grid-cols-2 gap-8 w-full mb-8">
                    <div className="text-left cursor-pointer hover:opacity-80 transition-opacity" onClick={() => document.getElementById('duration-slider')?.scrollIntoView({behavior: 'smooth'})}>
                      <div className="text-[10px] font-mono text-tactical-muted uppercase">Дней</div>
                      <div className="text-xl font-bold">{durationDays}</div>
                    </div>
                    <div className="text-left cursor-pointer hover:opacity-80 transition-opacity" onClick={() => document.getElementById('people-count')?.scrollIntoView({behavior: 'smooth'})}>
                      <div className="text-[10px] font-mono text-tactical-muted uppercase">Людей</div>
                      <div className="text-xl font-bold">{peopleCount}</div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setActiveTab('pack')}
                    className="w-full bg-tactical-accent text-tactical-bg font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-tactical-accent-hover transition-all shadow-lg shadow-tactical-accent/20 cursor-pointer"
                  >
                    Перейти к сборке <ChevronRight className="w-5 h-5" />
                  </button>
                </section>
              </div>
            </motion.div>
          )}

          {activeTab === 'pack' && (
            <motion.div 
              key="pack"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Stats Header */}
              <div 
                className={cn(
                  "sticky top-[69px] z-40 flex items-center justify-between bg-tactical-card/95 backdrop-blur-xl border border-tactical-border shadow-2xl overflow-hidden transition-all duration-300 mb-8",
                  isSticky ? "py-2 px-6 rounded-b-2xl border-t-0" : "p-6 rounded-2xl"
                )}
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Shield className={cn("text-tactical-accent transition-all duration-300", isSticky ? "w-12 h-12 -mt-2" : "w-24 h-24")} />
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full relative z-10 gap-2 sm:gap-4">
                  <div className="flex flex-row items-center gap-4 sm:gap-8 justify-between sm:justify-start w-full sm:w-auto">
                    <div className="flex flex-col">
                      <span className={cn("font-mono text-tactical-muted uppercase tracking-widest transition-all duration-300", isSticky ? "text-[9px] mb-0" : "text-xs mb-1")}>Цель запаса</span>
                      <div className="flex flex-wrap items-baseline gap-1 sm:gap-2">
                        <span className={cn("font-black text-tactical-accent transition-all duration-300", isSticky ? "text-lg" : "text-3xl")}>{formatDuration(durationDays)}</span>
                        <span className={cn("font-mono text-tactical-muted uppercase transition-all duration-300 whitespace-nowrap", isSticky ? "text-[9px]" : "text-sm")}>{totalCaloriesNeeded.toLocaleString()} ККАЛ</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col text-right sm:text-left">
                      <span className={cn("font-mono text-tactical-muted uppercase tracking-widest transition-all duration-300 flex items-center justify-end sm:justify-start gap-2", isSticky ? "text-[9px] mb-0" : "text-xs mb-1")}>
                        Набрано сейчас
                        {isSticky && <span className="text-tactical-accent font-bold">{Math.round(progress)}%</span>}
                      </span>
                      <div className="flex flex-wrap items-baseline justify-end sm:justify-start gap-1 sm:gap-2">
                        <span className={cn("font-black transition-all duration-300", progress >= 95 ? "text-tactical-accent" : "text-white", isSticky ? "text-lg" : "text-3xl")}>
                          {formatDurationPrecise(packedDurationDays)}
                        </span>
                        <span className={cn("font-mono text-tactical-muted uppercase transition-all duration-300 whitespace-nowrap", isSticky ? "text-[9px]" : "text-sm")}>{currentCaloriesPacked.toLocaleString()} ККАЛ</span>
                      </div>
                    </div>
                  </div>

                  {isSticky && (
                    <button 
                      onClick={() => setActiveTab('summary')}
                      className={cn(
                        "px-4 py-2 rounded-lg font-black uppercase tracking-tighter transition-all cursor-pointer shrink-0 text-xs w-full sm:w-auto text-center mt-2 sm:mt-0",
                        progress >= 97 
                          ? "bg-tactical-accent text-tactical-bg shadow-lg shadow-tactical-accent/20 hover:scale-[1.02]" 
                          : "bg-tactical-bg border border-tactical-border text-tactical-muted hover:text-white"
                      )}
                    >
                      К итогам
                    </button>
                  )}
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex bg-tactical-card p-1 rounded-lg border border-tactical-border w-fit mx-auto mb-8">
                <button
                  onClick={() => setPackMode('auto')}
                  className={cn(
                    "px-6 py-2 rounded-md text-sm font-bold transition-all cursor-pointer",
                    packMode === 'auto' ? "bg-tactical-accent text-tactical-bg" : "text-tactical-muted hover:text-tactical-text"
                  )}
                >
                  Автоматический подбор
                </button>
                <button
                  onClick={() => setPackMode('manual')}
                  className={cn(
                    "px-6 py-2 rounded-md text-sm font-bold transition-all cursor-pointer",
                    packMode === 'manual' ? "bg-tactical-accent text-tactical-bg" : "text-tactical-muted hover:text-tactical-text"
                  )}
                >
                  Ручная сборка
                </button>
              </div>

              {packMode === 'auto' ? (
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Auto Configurator */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-tactical-card border border-tactical-border rounded-xl p-5">
                      <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-tactical-accent" />
                        Настройки автоподбора
                      </h2>
                      
                      <div className="space-y-4 mb-6">
                        <label className="block text-xs font-mono text-tactical-muted uppercase">Выберите бокс</label>
                        <div className="grid grid-cols-2 gap-2">
                          {CONTAINER_TYPES.map(t => (
                            <div
                              key={t.id}
                              onClick={() => setAutoContainerId(t.id)}
                              className={cn(
                                "p-2 rounded-lg border text-left flex flex-col gap-1 transition-all relative cursor-pointer",
                                autoContainerId === t.id ? "bg-tactical-accent/10 border-tactical-accent" : "bg-tactical-bg border-tactical-border hover:border-tactical-muted"
                              )}
                            >
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setZoomImage({ url: t.icon, title: t.name, desc: t.description }); }}
                                  className="absolute top-3 right-3 p-1 bg-tactical-bg/80 backdrop-blur rounded text-tactical-muted hover:text-white hover:bg-tactical-accent transition-all z-10 cursor-pointer"
                                >
                                  <Info className="w-3 h-3" />
                                </button>
                                <div className="h-16 w-full bg-tactical-bg relative overflow-hidden rounded mb-1">
                                  <img src={t.icon} alt={t.name} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                                </div>
                              <span className="text-[10px] font-bold leading-tight pr-5">{t.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {activeContainers.length > 1 && (
                        <div className="flex items-center justify-between mb-6 p-3 bg-tactical-bg rounded-lg border border-tactical-border">
                          <span className="text-xs font-mono text-tactical-muted uppercase">Перемешать пакеты</span>
                          <button 
                            onClick={() => setAutoMix(!autoMix)}
                            className={cn(
                              "w-12 h-6 rounded-full transition-colors relative cursor-pointer",
                              autoMix ? "bg-tactical-accent" : "bg-tactical-border"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 bg-white rounded-full absolute top-1 transition-transform",
                              autoMix ? "left-7" : "left-1"
                            )} />
                          </button>
                        </div>
                      )}

                      <div className="space-y-4">
                        <label className="block text-xs font-mono text-tactical-muted uppercase">Пул продуктов</label>
                        <div className="space-y-3">
                          {autoPool.map(item => {
                            const packet = FOOD_PACKETS.find(p => p.id === item.packetId)!;
                            const totalProp = autoPool.reduce((sum, p) => sum + p.proportion, 0);
                            const percentage = totalProp > 0 ? Math.round((item.proportion / totalProp) * 100) : 0;
                            return (
                              <div key={item.packetId} className="bg-tactical-bg p-3 rounded-lg border border-tactical-border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-bold">{packet.name}</span>
                                  <button onClick={() => toggleAutoPoolItem(item.packetId)} className="text-tactical-muted hover:text-red-400 cursor-pointer">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-3">
                                  <input 
                                    type="range" 
                                    min="0" max="10" 
                                    value={item.proportion}
                                    onChange={(e) => updateAutoPoolProportion(item.packetId, parseInt(e.target.value))}
                                    className="flex-1 accent-tactical-accent"
                                  />
                                  <span className="text-[10px] font-mono w-8 text-right">{percentage}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="pt-2">
                          <label className="block text-[10px] font-mono text-tactical-muted uppercase mb-2">Добавить в пул</label>
                          <div className="flex flex-wrap gap-2">
                            {FOOD_PACKETS.filter(p => !autoPool.find(ap => ap.packetId === p.id)).map(packet => (
                              <button
                                key={packet.id}
                                onClick={() => toggleAutoPoolItem(packet.id)}
                                className="text-[10px] px-2 py-1 bg-tactical-bg border border-tactical-border rounded hover:border-tactical-accent transition-colors cursor-pointer"
                              >
                                + {packet.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* Auto Result */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xs font-mono text-tactical-muted uppercase tracking-widest">Сформированный склад ({activeContainers.length} ед.)</h2>
                        {manualAutoContainers && (
                          <button 
                            onClick={resetAutoContainers}
                            className="text-[10px] font-mono text-tactical-accent hover:underline flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" /> Вернуться к рассчитанному количеству
                          </button>
                        )}
                      </div>

                      {activeContainers.length === 0 ? (
                        <div className="border-2 border-dashed border-tactical-border rounded-2xl h-64 flex flex-col items-center justify-center text-tactical-muted">
                          <Zap className="w-12 h-12 mb-4 opacity-20" />
                          <p className="text-sm">Добавьте продукты в пул для автоматического расчета</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {groupedAutoContainers.map((group, idx) => {
                            const container = group.container;
                            const type = CONTAINER_TYPES.find(t => t.id === container.containerTypeId)!;
                            const usedUnits = container.packetIds.reduce((acc, pId) => acc + SIZE_UNITS[FOOD_PACKETS.find(pkt => pkt.id === pId)!.size], 0);
                            const maxUnits = type.mCapacity * 6 + type.extraSCapacity;
                            
                            return (
                              <div key={idx} className="bg-tactical-card border border-tactical-border rounded-xl flex flex-col relative">
                                {group.count > 1 && (
                                  <div className="absolute -top-3 -right-3 bg-tactical-accent text-tactical-bg font-black text-lg px-3 py-1 rounded-lg shadow-lg z-10">
                                    x{group.count}
                                  </div>
                                )}
                                <div className="bg-tactical-bg/50 px-4 py-3 border-b border-tactical-border flex items-center justify-between rounded-t-xl">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded overflow-hidden relative group-img">
                                      <img src={type.icon} alt={type.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      <button 
                                        onClick={() => setZoomImage({ url: type.icon, title: type.name, desc: type.description })}
                                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                      >
                                        <Maximize2 className="w-3 h-3 text-white" />
                                      </button>
                                    </div>
                                    <div>
                                      <span className="text-xs font-bold uppercase">{type.name}</span>
                                      <div className="text-[10px] font-mono text-tactical-muted">
                                        Занято: {usedUnits} / {maxUnits} ед.
                                      </div>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      group.ids.forEach(id => removeContainer(id));
                                    }}
                                    className="p-1.5 text-tactical-muted hover:text-red-400 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              
                              <div className="p-4 flex-1">
                                <div className="space-y-1">
                                  {Object.entries(
                                    container.packetIds.reduce((acc, pId) => {
                                      acc[pId] = (acc[pId] || 0) + 1;
                                      return acc;
                                    }, {} as Record<string, number>)
                                  ).map(([pId, count]) => {
                                    const p = FOOD_PACKETS.find(pkt => pkt.id === pId)!;
                                    return (
                                      <div key={pId} className="flex items-center justify-between bg-tactical-bg/50 p-2 rounded border border-tactical-border">
                                        <div className="flex items-center gap-2">
                                          <Package className="w-4 h-4 text-tactical-muted" />
                                          <span className="text-sm font-bold">{p.name}</span>
                                          <span className="text-[10px] text-tactical-muted px-1 bg-tactical-border rounded">{p.size}</span>
                                        </div>
                                        <span className="text-xs font-mono text-tactical-muted">{count} шт</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                </div>
              ) : (
                /* Manual Mode */
                <div className="space-y-8">
                  <div className="grid lg:grid-cols-4 gap-8">
                    {/* Catalog */}
                    <div className="lg:col-span-1 flex flex-col">
                      <h2 className="text-xs font-mono text-tactical-muted uppercase tracking-widest mb-4 shrink-0">Справочник продуктов</h2>
                      <div className="relative flex-1 min-h-[600px]">
                        <div className="absolute inset-0 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                          {FOOD_PACKETS.map((packet) => (
                            <div 
                              key={packet.id}
                              className="bg-tactical-card border border-tactical-border rounded-lg flex flex-col overflow-hidden group relative"
                            >
                            <div 
                              onClick={() => setZoomImage({ url: packet.image, title: packet.name, desc: `${packet.calories} ккал | ${packet.weightKg} кг | ${packet.price} ₽` })}
                              className="h-24 w-full bg-tactical-bg relative cursor-pointer"
                            >
                              <img src={packet.image} alt={packet.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                              <span className={cn(
                                "absolute top-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded backdrop-blur",
                                packet.size === 'M' ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : 
                                packet.size === 'MS' ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : 
                                "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                              )}>
                                {packet.size}
                              </span>
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Maximize2 className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="p-3">
                              <div className="text-xs font-bold mb-1">{packet.name}</div>
                              <div className="flex justify-between items-center mb-3">
                                <div className="text-[10px] font-mono text-tactical-muted">
                                  {packet.calories} ккал | {packet.weightKg} кг
                                </div>
                                <span className="text-xs font-bold text-tactical-accent">{packet.price} ₽</span>
                              </div>
                              <button 
                                onClick={() => addPacketToFirstAvailable(packet.id)}
                                className="w-full py-2 rounded-lg bg-tactical-bg border border-tactical-border flex items-center justify-center text-tactical-muted hover:text-tactical-accent hover:border-tactical-accent transition-colors cursor-pointer text-xs font-bold uppercase"
                              >
                                <Plus className="w-3 h-3 mr-1" /> Добавить в бокс
                              </button>
                            </div>
                          </div>
                        ))}
                        </div>
                      </div>
                    </div>

                    {/* Packed Containers */}
                    <div className="lg:col-span-3 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xs font-mono text-tactical-muted uppercase tracking-widest">Ваш склад ({packedContainers.length} ед.)</h2>
                        {packedContainers.length > 0 && (
                          <button 
                            onClick={() => setPackedContainers([])}
                            className="text-[10px] font-mono text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Очистить всё
                          </button>
                        )}
                      </div>

                      {packedContainers.length === 0 ? (
                        <button 
                          onClick={() => setIsBoxSelectorOpen(true)}
                          className="w-full border-2 border-dashed border-tactical-border rounded-2xl h-64 flex flex-col items-center justify-center text-tactical-muted hover:border-tactical-accent hover:text-tactical-accent transition-all cursor-pointer group"
                        >
                          <Plus className="w-12 h-12 mb-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                          <p className="text-sm font-bold uppercase tracking-widest">Добавить первый бокс</p>
                        </button>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {packedContainers.map((container) => {
                            const type = CONTAINER_TYPES.find(t => t.id === container.containerTypeId)!;
                            const usedUnits = container.packetIds.reduce((acc, pId) => acc + SIZE_UNITS[FOOD_PACKETS.find(pkt => pkt.id === pId)!.size], 0);
                            const maxUnits = type.mCapacity * 6 + type.extraSCapacity;
                            const isFull = usedUnits >= maxUnits;
                            
                            return (
                              <div key={container.id} className="bg-tactical-card border border-tactical-border rounded-xl flex flex-col">
                                  <div className="bg-tactical-bg/50 px-4 py-3 border-b border-tactical-border flex items-center justify-between rounded-t-xl">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded overflow-hidden relative group">
                                        <img src={type.icon} alt={type.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        <button 
                                          onClick={() => setZoomImage({ url: type.icon, title: type.name, desc: type.description })}
                                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Maximize2 className="w-3 h-3 text-white" />
                                        </button>
                                      </div>
                                      <div>
                                        <span className="text-xs font-bold uppercase">{type.name}</span>
                                        <div className="text-[10px] font-mono text-tactical-muted">
                                          Занято: {usedUnits} / {maxUnits} ед.
                                        </div>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => removeContainer(container.id)}
                                      className="p-1.5 text-tactical-muted hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                
                                <div className="p-4 flex-1">
                                  <div className="space-y-1 mb-4">
                                    {Object.entries(
                                      container.packetIds.reduce((acc, pId) => {
                                        acc[pId] = (acc[pId] || 0) + 1;
                                        return acc;
                                      }, {} as Record<string, number>)
                                    ).map(([pId, count]) => {
                                      const p = FOOD_PACKETS.find(pkt => pkt.id === pId)!;
                                      return (
                                        <div key={pId} className="flex items-center justify-between bg-tactical-bg/50 p-2 rounded border border-tactical-border">
                                          <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-tactical-muted" />
                                            <span className="text-sm font-bold">{p.name}</span>
                                            <span className="text-[10px] text-tactical-muted px-1 bg-tactical-border rounded">{p.size}</span>
                                          </div>
                                          <div className="flex items-center gap-3 bg-tactical-bg rounded border border-tactical-border px-1">
                                            <button onClick={() => removePacketFromContainerByPId(container.id, pId)} className="p-1 hover:text-red-400 cursor-pointer"><Minus className="w-3 h-3" /></button>
                                            <span className="text-xs font-mono w-4 text-center">{count}</span>
                                            <button onClick={() => addPacketToContainer(container.id, pId)} className="p-1 hover:text-tactical-accent cursor-pointer"><Plus className="w-3 h-3" /></button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    
                                    {!isFull && (
                                      <div className="w-full mt-2 relative">
                                        <button 
                                          onClick={() => setActiveDropdown(activeDropdown === container.id ? null : container.id)}
                                          className="w-full h-8 border border-dashed border-tactical-border rounded flex items-center justify-center text-tactical-muted hover:border-tactical-accent hover:text-tactical-accent transition-all cursor-pointer"
                                        >
                                          <Plus className="w-4 h-4" />
                                          <span className="text-[10px] ml-2 font-mono">Добавить пакет</span>
                                        </button>
                                        
                                        {activeDropdown === container.id && (
                                          <>
                                            <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                                            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-tactical-card border border-tactical-border rounded-lg shadow-2xl p-2 max-h-64 overflow-y-auto">
                                              <div className="text-[10px] font-mono text-tactical-muted uppercase mb-2 px-2">Выберите продукт</div>
                                              {FOOD_PACKETS.map(p => {
                                                const canFit = usedUnits + SIZE_UNITS[p.size] <= maxUnits;
                                                return (
                                                  <button
                                                    key={p.id}
                                                    disabled={!canFit}
                                                    onClick={() => addPacketToContainer(container.id, p.id)}
                                                    className={cn(
                                                      "w-full text-left px-3 py-2 text-[10px] rounded flex justify-between items-center mb-1 cursor-pointer",
                                                      canFit ? "hover:bg-tactical-accent hover:text-tactical-bg" : "opacity-30 cursor-not-allowed"
                                                    )}
                                                  >
                                                    <span className="flex items-center gap-2">
                                                      <span className="w-4 font-bold opacity-60">{p.size}</span>
                                                      {p.name}
                                                    </span>
                                                    <span className="font-mono">{p.calories} ккал</span>
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Empty Add Box Card */}
                          <button 
                            onClick={() => setIsBoxSelectorOpen(true)}
                            className="bg-tactical-card/50 border-2 border-dashed border-tactical-border hover:border-tactical-accent hover:text-tactical-accent transition-colors rounded-xl flex flex-col items-center justify-center min-h-[200px] text-tactical-muted cursor-pointer group"
                          >
                            <Plus className="w-8 h-8 mb-2 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                            <span className="text-xs font-bold uppercase tracking-widest">Добавить бокс</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-8 border-t border-tactical-border mt-8">
                <button 
                  onClick={() => setActiveTab('summary')}
                  disabled={progress < 95}
                  className={cn(
                    "w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer",
                    progress >= 95 ? "bg-tactical-accent text-tactical-bg hover:bg-tactical-accent-hover shadow-tactical-accent/20" : "bg-tactical-border text-tactical-muted cursor-not-allowed"
                  )}
                >
                  Перейти к итогам <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'summary' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="text-center mb-12">
                <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">Склад сформирован</h1>
                <p className="text-tactical-muted max-w-xl mx-auto">
                  Ваш стратегический запас готов. Проверьте детали и выберите способ завершения.
                </p>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <section className="bg-tactical-card border border-tactical-border rounded-2xl p-6">
                    <h2 className="text-xs font-mono text-tactical-muted uppercase tracking-widest mb-6">Параметры запаса</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-tactical-muted uppercase mb-1">Достижение цели</span>
                        <span className="text-xl font-black text-tactical-accent whitespace-nowrap">{Math.round(progress)}%</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-tactical-muted uppercase mb-1">Длительность</span>
                        <span className="text-xl font-black text-white">{formatDurationPrecise(packedDurationDays)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-tactical-muted uppercase mb-1">Боксы</span>
                        <span className="text-xl font-black text-white whitespace-nowrap">{activeContainers.length} ед.</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-tactical-muted uppercase mb-1">Общий вес</span>
                        <span className="text-xl font-black text-white whitespace-nowrap">
                          {activeContainers.reduce((acc, c) => acc + c.packetIds.reduce((pAcc, pId) => pAcc + FOOD_PACKETS.find(pkt => pkt.id === pId)!.weightKg, 0), 0).toFixed(1)} кг
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="bg-tactical-card border border-tactical-border rounded-2xl p-6">
                    <h2 className="text-xs font-mono text-tactical-muted uppercase tracking-widest mb-6">Состав по боксам</h2>
                    <div className="space-y-4">
                      {Object.entries(
                        activeContainers.reduce((acc, c) => {
                          acc[c.containerTypeId] = (acc[c.containerTypeId] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([typeId, count]) => {
                        const type = CONTAINER_TYPES.find(t => t.id === typeId)!;
                        return (
                          <div key={typeId} className="flex items-center justify-between p-4 bg-tactical-bg/50 rounded-xl border border-tactical-border">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg overflow-hidden">
                                <img src={type.icon} alt={type.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div>
                                <div className="font-bold">{type.name}</div>
                                <div className="text-xs text-tactical-muted">{count} шт. x {type.price} ₽</div>
                              </div>
                            </div>
                            <div className="text-lg font-black text-white">{(count * type.price).toLocaleString()} ₽</div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="bg-tactical-card border border-tactical-border rounded-2xl p-6">
                    <h2 className="text-xs font-mono text-tactical-muted uppercase tracking-widest mb-6">Состав продуктов</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(
                        activeContainers.reduce((acc, c) => {
                          c.packetIds.forEach(pId => {
                            acc[pId] = (acc[pId] || 0) + 1;
                          });
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([pId, count]) => {
                        const p = FOOD_PACKETS.find(pkt => pkt.id === pId)!;
                        return (
                          <div key={pId} className="flex items-center justify-between p-3 bg-tactical-bg/30 rounded-lg border border-tactical-border/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-tactical-bg overflow-hidden">
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div>
                                <div className="text-xs font-bold">{p.name}</div>
                                <div className="text-[10px] text-tactical-muted">{count} шт.</div>
                              </div>
                            </div>
                            <div className="text-xs font-bold text-tactical-accent">{(count * p.price).toLocaleString()} ₽</div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <div className="bg-tactical-card border border-tactical-border p-8 rounded-xl shadow-2xl">
                    <div className="text-xs font-mono text-tactical-muted uppercase tracking-widest mb-2">Итоговая стоимость</div>
                    <div 
                      className="font-black text-white mb-8 whitespace-nowrap"
                      style={{ 
                        fontSize: getDynamicFontSize(
                          (
                            activeContainers.reduce((acc, c) => acc + CONTAINER_TYPES.find(t => t.id === c.containerTypeId)!.price, 0) +
                            activeContainers.reduce((acc, c) => acc + c.packetIds.reduce((pAcc, pId) => pAcc + FOOD_PACKETS.find(pkt => pkt.id === pId)!.price, 0), 0)
                          ).toLocaleString(), 
                          3, 1.5, 8
                        ) 
                      }}
                    >
                      {(
                        activeContainers.reduce((acc, c) => acc + CONTAINER_TYPES.find(t => t.id === c.containerTypeId)!.price, 0) +
                        activeContainers.reduce((acc, c) => acc + c.packetIds.reduce((pAcc, pId) => pAcc + FOOD_PACKETS.find(pkt => pkt.id === pId)!.price, 0), 0)
                      ).toLocaleString()} ₽
                    </div>
                    
                    <div className="space-y-3">
                      <button 
                        onClick={() => setShowOrderForm('order')}
                        className="w-full py-4 bg-tactical-accent text-tactical-bg rounded-xl font-black uppercase tracking-tighter hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-tactical-accent/20"
                      >
                        <Zap className="w-5 h-5" /> Создать запас
                      </button>
                      <button 
                        onClick={() => setShowOrderForm('consult')}
                        className="w-full py-4 bg-tactical-bg border border-tactical-border text-white rounded-xl font-bold uppercase text-sm hover:bg-tactical-border/50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" /> Получить консультацию
                      </button>
                    </div>
                  </div>

                  <div className="bg-tactical-card border border-tactical-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="w-6 h-6 text-tactical-accent" />
                      <h3 className="font-bold">Гарантия качества</h3>
                    </div>
                    <p className="text-xs text-tactical-muted leading-relaxed">
                      Все продукты упакованы в вакуумную среду с поглотителями кислорода. Срок хранения до 25 лет при соблюдении температурного режима.
                    </p>
                  </div>

                  <button 
                    onClick={() => setShowIdeaForm(true)}
                    className="w-full py-4 border border-tactical-border rounded-xl text-tactical-muted hover:text-tactical-accent hover:border-tactical-accent transition-all flex items-center justify-center gap-2 text-sm font-bold cursor-pointer"
                  >
                    <Zap className="w-4 h-4" /> Предложить идею
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-tactical-bg/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setZoomImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-4xl w-full bg-tactical-card border border-tactical-border rounded-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative aspect-video">
                <img src={zoomImage.url} alt={zoomImage.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button 
                  onClick={() => setZoomImage(null)}
                  className="absolute top-4 right-4 p-2 bg-tactical-bg/50 backdrop-blur rounded-full text-white hover:bg-tactical-accent hover:text-tactical-bg transition-all cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8">
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">{zoomImage.title}</h2>
                {zoomImage.desc && <p className="text-tactical-muted text-lg">{zoomImage.desc}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showOrderForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-tactical-bg/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="max-w-md w-full bg-tactical-card border border-tactical-border rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                  {showOrderForm === 'order' ? 'Оформление запаса' : 'Консультация'}
                </h2>
                <button onClick={() => setShowOrderForm(null)} className="p-2 text-tactical-muted hover:text-white cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form className="space-y-4" onSubmit={e => { 
                e.preventDefault(); 
                const type = showOrderForm;
                setShowOrderForm(null); 
                showToast(type === 'order' ? 'Заявка отправлена!' : 'Запрос на консультацию отправлен!'); 
              }}>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-tactical-muted uppercase">Ваше имя</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tactical-muted" />
                    <input type="text" required className="w-full bg-tactical-bg border border-tactical-border rounded-xl py-3 pl-10 pr-4 text-white focus:border-tactical-accent outline-none" placeholder="Иван Иванов" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-tactical-muted uppercase">Телефон</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tactical-muted" />
                    <input type="tel" required className="w-full bg-tactical-bg border border-tactical-border rounded-xl py-3 pl-10 pr-4 text-white focus:border-tactical-accent outline-none" placeholder="+7 (999) 000-00-00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-tactical-muted uppercase">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tactical-muted" />
                    <input type="email" className="w-full bg-tactical-bg border border-tactical-border rounded-xl py-3 pl-10 pr-4 text-white focus:border-tactical-accent outline-none" placeholder="ivan@example.com (необязательно)" />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-tactical-accent text-tactical-bg rounded-xl font-black uppercase tracking-tighter mt-4 hover:scale-[1.02] transition-transform">
                  Отправить заявку
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showIdeaForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-tactical-bg/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="max-w-md w-full bg-tactical-card border border-tactical-border rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Предложить идею</h2>
                <button onClick={() => setShowIdeaForm(false)} className="p-2 text-tactical-muted hover:text-white cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowIdeaForm(false); showToast('Спасибо за идею!'); }}>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-tactical-muted uppercase">Ваша идея или комментарий</label>
                  <textarea required className="w-full bg-tactical-bg border border-tactical-border rounded-xl py-3 px-4 text-white focus:border-tactical-accent outline-none min-h-[120px]" placeholder="Опишите ваше предложение..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-tactical-muted uppercase">Контакт для связи (опционально)</label>
                  <input type="text" className="w-full bg-tactical-bg border border-tactical-border rounded-xl py-3 px-4 text-white focus:border-tactical-accent outline-none" placeholder="Email или телефон" />
                </div>
                <button type="submit" className="w-full py-4 bg-tactical-accent text-tactical-bg rounded-xl font-black uppercase tracking-tighter mt-4 hover:scale-[1.02] transition-transform">
                  Отправить
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBoxSelectorOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBoxSelectorOpen(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-tactical-card border border-tactical-border p-6 md:p-8 rounded-2xl max-w-4xl w-full relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setIsBoxSelectorOpen(false)}
                className="absolute top-4 right-4 text-tactical-muted hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-2xl font-black uppercase mb-8 tracking-tighter">Выберите тип бокса</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CONTAINER_TYPES.map((type) => (
                  <div 
                    key={type.id}
                    onClick={() => {
                      addContainer(type.id);
                      setIsBoxSelectorOpen(false);
                    }}
                    className="bg-tactical-bg border border-tactical-border rounded-xl p-6 flex flex-col items-center text-center cursor-pointer hover:border-tactical-accent hover:shadow-lg hover:shadow-tactical-accent/10 transition-all group"
                  >
                    <div className="w-24 h-24 mb-4 rounded-xl overflow-hidden relative">
                      <img src={type.icon} alt={type.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-tactical-accent/0 group-hover:bg-tactical-accent/20 transition-colors" />
                    </div>
                    <h4 className="font-bold text-lg mb-2 uppercase tracking-wide">{type.name}</h4>
                    <p className="text-xs text-tactical-muted mb-6 flex-1">{type.description}</p>
                    <div className="mt-auto text-tactical-accent font-mono text-xl font-bold bg-tactical-accent/10 px-4 py-2 rounded-lg w-full">
                      {type.price} ₽
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Stats Bar */}
      {activeTab === 'pack' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-tactical-card border-t border-tactical-border p-4 flex items-center justify-between z-50">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-tactical-muted uppercase">Прогресс</span>
            <span className="text-sm font-bold">{currentCaloriesPacked.toLocaleString()} / {totalCaloriesNeeded.toLocaleString()}</span>
          </div>
          <div className="w-24 h-2 bg-tactical-border rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-tactical-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-tactical-card border border-tactical-border shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-tactical-accent" />
            <span className="text-sm font-bold text-white whitespace-nowrap">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
