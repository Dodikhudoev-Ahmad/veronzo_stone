import { Navigate, Route, Routes } from 'react-router-dom';
import './styles.css';
import { CatalogCategoryPage } from './CatalogCategoryPage';
import { ProductDetailPage } from './ProductDetailPage';
import { PublicHomePage } from './PublicHomePage';

export function PublicRouter() {
  return (
    <Routes>
      <Route path="/" element={<PublicHomePage />} />
      <Route path="/catalog/:categorySlug" element={<CatalogCategoryPage />} />
      <Route path="/catalog/:categorySlug/:productId" element={<ProductDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
