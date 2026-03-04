import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "lv_favorites_v1";

type HotelData = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  stars?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  price?: number | null;
  imageUrl?: string | null;
  facilities?: string[];
  [key: string]: any;
};

type FavoritesMap = Record<string, HotelData>;

interface FavoritesCtx {
  favorites: HotelData[];
  favCount: number;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (hotel: HotelData) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
}

const Ctx = createContext<FavoritesCtx>({
  favorites: [],
  favCount: 0,
  isFavorite: () => false,
  toggleFavorite: () => {},
  removeFavorite: () => {},
  clearFavorites: () => {},
});

function readStorage(): FavoritesMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeStorage(map: FavoritesMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<FavoritesMap>(readStorage);

  // Sync from other tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setMap(readStorage());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const toggleFavorite = useCallback((hotel: HotelData) => {
    setMap(prev => {
      const next = { ...prev };
      if (next[hotel.id]) {
        delete next[hotel.id];
      } else {
        next[hotel.id] = hotel;
      }
      writeStorage(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setMap(prev => {
      const next = { ...prev };
      delete next[id];
      writeStorage(next);
      return next;
    });
  }, []);

  const clearFavorites = useCallback(() => {
    setMap({});
    writeStorage({});
  }, []);

  const isFavorite = useCallback((id: string) => Boolean(map[id]), [map]);
  const favorites = Object.values(map);
  const favCount = favorites.length;

  return (
    <Ctx.Provider value={{ favorites, favCount, isFavorite, toggleFavorite, removeFavorite, clearFavorites }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFavorites() {
  return useContext(Ctx);
}
