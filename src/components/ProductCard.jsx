import React from 'react';
import { Link } from 'react-router-dom';
import { Tag } from 'lucide-react';

const ProductCard = ({ product }) => {
  return (
    <div className="group relative border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <Link to={`/product/${product.id}`} className="block h-full">
        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200">
          <img
            src={(product.image_urls && product.image_urls[0]) || 'https://via.placeholder.com/400'}
            alt={product.name}
            className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity"
          />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-sm font-medium text-gray-800">
            <span aria-hidden="true" className="absolute inset-0" />
            {product.name}
          </h3>
          <div className="mt-2 text-xs text-gray-500">
            <span>{product.condition || 'N/A'}</span> &middot; <span>{product.size}</span> &middot; <span>{product.categories?.name || 'N/A'}</span>
          </div>
          {product.drop_settings && (
            <div className="mt-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 self-start">
              <Tag className="mr-1.5 h-3 w-3" />
              {product.drop_settings.name}
            </div>
          )}
          <div className="flex-grow"></div>
          <div className="flex items-baseline gap-2 mt-3">
            {product.sale_price && product.sale_price > 0 ? (
              <><p className="text-lg font-semibold text-red-600">{product.sale_price.toLocaleString()} Ft</p><p className="text-sm text-gray-500 line-through">{product.price.toLocaleString()} Ft</p></>
            ) : (
              <p className="text-lg font-semibold text-gray-900">{product.price.toLocaleString()} Ft</p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;