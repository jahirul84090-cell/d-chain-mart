"use client";

import React from "react";
import {
  Beef,
  Cake,
  Milk,
  Soup,
  Fish,
  Wheat,
  Utensils,
  Leaf,
  Droplet,
  HeartPulse,
  Baby,
} from "lucide-react";

const categories = [
  { name: "All Categories", icon: <Utensils className="w-5 h-5" /> },
  { name: "Fruits & Vegetables", icon: <Leaf className="w-5 h-5" /> },
  { name: "Meats & Seafood", icon: <Fish className="w-5 h-5" /> },
  { name: "Breakfast & Dairy", icon: <Milk className="w-5 h-5" /> },
  { name: "Breads & Bakery", icon: <Cake className="w-5 h-5" /> },
  { name: "Beverages", icon: <Droplet className="w-5 h-5" /> },
  { name: "Frozen Foods", icon: <Soup className="w-5 h-5" /> },
  { name: "Biscuits & Snacks", icon: <Wheat className="w-5 h-5" /> },
  { name: "Grocery & Staples", icon: <Beef className="w-5 h-5" /> },
  { name: "Household Needs", icon: <Utensils className="w-5 h-5" /> },
  { name: "Healthcare", icon: <HeartPulse className="w-5 h-5" /> },
  { name: "Baby & Pregnancy", icon: <Baby className="w-5 h-5" /> },
];

export default function Sidebar({ activeCategory, onCategoryClick }) {
  return (
    <aside className="w-64 bg-white p-4 h-full hidden md:block">
      <h2 className="text-lg font-bold mb-4">All Categories</h2>
      <ul className="space-y-2">
        {categories.map((category) => {
          const isActive = category.name === activeCategory;
          return (
            <li
              key={category.name}
              onClick={() => onCategoryClick(category.name)}
              className={`
                flex items-center space-x-3 cursor-pointer transition-colors duration-200 p-2 rounded-md
                ${
                  isActive
                    ? "bg-purple-600 text-white font-semibold"
                    : "text-gray-700 hover:text-purple-600 hover:bg-gray-100"
                }
              `}
            >
              {category.icon}
              <span>{category.name}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
