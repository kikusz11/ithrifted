import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const CategoryColumn = ({ categories, onCategoryHover, onCategorySelect, activeCategoryId }) => {
  return (
    <ul className="py-2 w-48 border-r last:border-r-0 bg-white">
      {categories.map((category) => (
        <li
          key={category.id}
          onMouseEnter={() => onCategoryHover(category)}
        >
          <Link
            to={`/?category=${category.id}`}
            onClick={() => onCategorySelect(category)}
            className={`flex justify-between items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
              activeCategoryId === category.id ? 'bg-gray-100' : ''
            }`}
          >
            <span>{category.name}</span>
            {category.children && category.children.length > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default CategoryColumn;