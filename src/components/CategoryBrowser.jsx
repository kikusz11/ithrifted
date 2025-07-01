import React, { useState } from 'react';
import CategoryColumn from './CategoryColumn';

const CategoryBrowser = ({ categoryTree, onCategorySelect }) => {
  // An array of arrays, where each inner array is a list of categories for a column.
  const [columns, setColumns] = useState([categoryTree]);
  // An array of category IDs representing the hovered path.
  const [activePath, setActivePath] = useState([]);

  const handleCategoryHover = (category, columnIndex) => {
    // Create a new path up to the current column.
    const newPath = activePath.slice(0, columnIndex);
    newPath[columnIndex] = category.id;
    setActivePath(newPath);

    // Create a new set of columns based on the hover.
    const newColumns = columns.slice(0, columnIndex + 1);
    if (category.children && category.children.length > 0) {
      newColumns.push(category.children);
    }
    setColumns(newColumns);
  };

  return (
    <div className="flex bg-white rounded-md shadow-lg border overflow-hidden">
      {columns.map((columnCategories, index) => (
        <CategoryColumn
          key={index}
          categories={columnCategories}
          onCategoryHover={(category) => handleCategoryHover(category, index)}
          onCategorySelect={onCategorySelect}
          activeCategoryId={activePath[index]}
        />
      ))}
    </div>
  );
};

export default CategoryBrowser;