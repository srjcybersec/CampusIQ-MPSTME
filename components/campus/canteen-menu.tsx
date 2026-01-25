"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { motion } from "framer-motion";

interface MenuItem {
  name: string;
  price: number;
  category: string;
}

const menuItems: MenuItem[] = [
  // BREAKFAST
  { name: "TOAST WITH BUTTER", price: 23, category: "BREAKFAST" },
  { name: "TOAST, BUTTER & JAM", price: 27, category: "BREAKFAST" },
  { name: "UPMA", price: 10, category: "BREAKFAST" },
  { name: "POTATO POHA", price: 32, category: "BREAKFAST" },
  { name: "VADA PAV", price: 17, category: "BREAKFAST" },
  { name: "MISSAL PAV", price: 38, category: "BREAKFAST" },
  { name: "BATATA WADA (2PCS)", price: 32, category: "BREAKFAST" },
  { name: "IDLI SAMBHAR", price: 32, category: "BREAKFAST" },
  { name: "BUTTER IDLI", price: 43, category: "BREAKFAST" },
  { name: "MEDU WADA SAMBHAR", price: 43, category: "BREAKFAST" },
  { name: "IDLI / MEDU WADA", price: 39, category: "BREAKFAST" },
  { name: "IDLI FRY", price: 43, category: "BREAKFAST" },
  { name: "DAHI IDLI", price: 43, category: "BREAKFAST" },
  
  // SOUTH INDIAN
  { name: "SADA DOSA", price: 32, category: "SOUTH INDIAN" },
  { name: "BUTTER SADA DOSA", price: 39, category: "SOUTH INDIAN" },
  { name: "MASALA DOSA", price: 39, category: "SOUTH INDIAN" },
  { name: "MYSORE SADA DOSA", price: 43, category: "SOUTH INDIAN" },
  { name: "MYSORE MASALA DOSA", price: 60, category: "SOUTH INDIAN" },
  { name: "CHEESE SADA DOSA", price: 60, category: "SOUTH INDIAN" },
  { name: "CHEESE MASALA DOSA", price: 63, category: "SOUTH INDIAN" },
  { name: "PLANE UTTAPAM", price: 32, category: "SOUTH INDIAN" },
  { name: "TOMATO UTTAPAM", price: 39, category: "SOUTH INDIAN" },
  { name: "ONION UTTAPAM", price: 43, category: "SOUTH INDIAN" },
  { name: "TOMATO ONION UTTAPAM", price: 43, category: "SOUTH INDIAN" },
  { name: "SCHEZWAN DOSA", price: 50, category: "SOUTH INDIAN" },
  { name: "CHEESE SCHEZWAN DOSA", price: 50, category: "SOUTH INDIAN" },
  
  // LUNCH
  { name: "VEG PULAO THALI", price: 76, category: "LUNCH" },
  { name: "LUNCH", price: 74, category: "LUNCH" },
  
  // PAV BHAJI
  { name: "PAV BHAJI", price: 63, category: "PAV BHAJI" },
  { name: "CHEESE PAV BHAJI", price: 83, category: "PAV BHAJI" },
  { name: "EXTRA PAV", price: 12, category: "PAV BHAJI" },
  
  // CHINESE STARTERS
  { name: "VEG CRISPY", price: 76, category: "CHINESE STARTERS" },
  { name: "VEG CHILLY DRY", price: 76, category: "CHINESE STARTERS" },
  { name: "PANEER CHILLY DRY", price: 95, category: "CHINESE STARTERS" },
  { name: "PANEER SCHEZWAN DRY", price: 88, category: "CHINESE STARTERS" },
  { name: "VEG MANCHURIAN DRY", price: 69, category: "CHINESE STARTERS" },
  { name: "MUSHROOM CHILLY DRY", price: 107, category: "CHINESE STARTERS" },
  { name: "PANEER CRISPY", price: 101, category: "CHINESE STARTERS" },
  { name: "IDLI CHILLY DRY", price: 76, category: "CHINESE STARTERS" },
  { name: "IDLI SCHEZWAN DRY", price: 76, category: "CHINESE STARTERS" },
  { name: "SCHEZWAN CRISPY FRIED POTATO", price: 83, category: "CHINESE STARTERS" },
  
  // CHINESE
  { name: "VEG FRIED RICE", price: 69, category: "CHINESE" },
  { name: "SCHEZWAN FRIED RICE", price: 76, category: "CHINESE" },
  { name: "HONG KONG FRIED RICE", price: 83, category: "CHINESE" },
  { name: "SINGAPORE FRIED RICE", price: 83, category: "CHINESE" },
  { name: "VEG HAKKA NOODLES", price: 69, category: "CHINESE" },
  { name: "VEG SCHEZWAN NOODLES", price: 83, category: "CHINESE" },
  { name: "VEG HONG KONG NOODLES", price: 83, category: "CHINESE" },
  
  // FRANKY
  { name: "VEG FRANKY", price: 43, category: "FRANKY" },
  { name: "PANEER FRANKY", price: 58, category: "FRANKY" },
  { name: "PANEER CHILLY FRANKY", price: 63, category: "FRANKY" },
  { name: "MANCHURIAN FRANKY", price: 58, category: "FRANKY" },
  
  // CHAAT
  { name: "CHOWPATTY BHEL", price: 38, category: "CHAAT" },
  { name: "CHINESE BHEL", price: 63, category: "CHAAT" },
  { name: "SEV PURI", price: 38, category: "CHAAT" },
  
  // FRUITS
  { name: "CUT FRUIT SALAD", price: 63, category: "FRUITS" },
  
  // CHAAT (SECOND PAGE)
  { name: "DAHI BATATA PURI", price: 50, category: "CHAAT" },
  { name: "DAHI BHEL", price: 50, category: "CHAAT" },
  { name: "PANI PURI", price: 38, category: "CHAAT" },
  
  // SANDWICHES
  { name: "VEG SANDWICH", price: 32, category: "SANDWICHES" },
  { name: "CHEESE PLAIN SANDWICH", price: 43, category: "SANDWICHES" },
  { name: "VEG CHEESE SANDWICH", price: 50, category: "SANDWICHES" },
  { name: "VEG GRILL SANDWICH", price: 69, category: "SANDWICHES" },
  { name: "BREAD BUTTER", price: 23, category: "SANDWICHES" },
  { name: "BREAD BUTTER TOAST", price: 25, category: "SANDWICHES" },
  { name: "BUN MASKA", price: 25, category: "SANDWICHES" },
  { name: "CHEESE TOAST SANDWICH", price: 50, category: "SANDWICHES" },
  { name: "VEG CHEESE TOAST SANDWICH", price: 58, category: "SANDWICHES" },
  
  // EGG PREPARATION
  { name: "MASALA OMELETTE WITH BREAD", price: 69, category: "EGG PREPARATION" },
  { name: "EGG BHURJEE WITH 2 PAV", price: 69, category: "EGG PREPARATION" },
  { name: "EGG CURRY WITH RICE", price: 125, category: "EGG PREPARATION" },
  { name: "BOILED EGGS (2 NOS.)", price: 27, category: "EGG PREPARATION" },
  { name: "FRIED EGGS (2 NOS.) WITH BREAD", price: 41, category: "EGG PREPARATION" },
  
  // NORTH INDIAN
  { name: "DAL TADKA", price: 74, category: "NORTH INDIAN" },
  { name: "DAL FRY", price: 68, category: "NORTH INDIAN" },
  { name: "TAVA VEG", price: 95, category: "NORTH INDIAN" },
  { name: "VEG KOLHAPURI", price: 89, category: "NORTH INDIAN" },
  { name: "PANEER PESHAWARI", price: 116, category: "NORTH INDIAN" },
  { name: "PANEER LAJAWAB", price: 116, category: "NORTH INDIAN" },
  { name: "PANEER PASANDA", price: 137, category: "NORTH INDIAN" },
  { name: "VEG ANDA CURRY", price: 126, category: "NORTH INDIAN" },
  { name: "STEAMED RICE", price: 69, category: "NORTH INDIAN" },
  { name: "JEERA RICE", price: 79, category: "NORTH INDIAN" },
  { name: "DAL KHICHDI", price: 79, category: "NORTH INDIAN" },
  { name: "VEG PULAO", price: 95, category: "NORTH INDIAN" },
  { name: "VEG BIRYANI", price: 95, category: "NORTH INDIAN" },
  { name: "PANEER PULAO", price: 116, category: "NORTH INDIAN" },
];

const categories = Array.from(new Set(menuItems.map(item => item.category))).sort();

export function CanteenMenu() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    let filtered = menuItems;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const groupedItems = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {};
    filteredItems.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  }, [filteredItems]);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#D4D4D8]" />
          <Input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#161616] border-[#222222] text-white placeholder:text-[#888888]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#D4D4D8] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "neon" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            data-cursor-hover
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "neon" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              data-cursor-hover
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      {Object.keys(groupedItems).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="text-white text-lg">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((item, index) => (
                      <motion.div
                        key={`${item.name}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className="flex items-center justify-between p-3 bg-[#161616] border border-[#222222] rounded-lg hover:border-[#333333] transition-colors"
                      >
                        <span className="text-white text-sm flex-1">{item.name}</span>
                        <span className="text-blue-400 font-semibold ml-4">₹{item.price}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card variant="glass">
          <CardContent className="p-12 text-center">
            <p className="text-white mb-2">No items found</p>
            <p className="text-sm text-[#D4D4D8]">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
