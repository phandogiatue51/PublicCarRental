import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import { motion } from "framer-motion";
import HeroPages from "../components/HeroPages";
import Footer from "../components/Footer";
import { brandAPI, typeAPI, modelAPI } from "../services/api";
import "../styles/Model.css";


function Models() {
  const [models, setModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch brands and types for dropdowns
    const fetchInitialData = async () => {
      try {
        const [brandsResponse, typesResponse] = await Promise.all([
          brandAPI.getAll(),
          typeAPI.getAll()
        ]);
        setBrands(brandsResponse || []);
        setTypes(typesResponse || []);
      } catch (error) {
        console.error("Failed to fetch brands and types:", error);
        toast({
          title: "Error",
          description: "Failed to load brands and types",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchInitialData();
  }, [toast]);

  useEffect(() => {
    // Fetch models based on selected brand and type
    const fetchModels = async () => {
      setLoading(true);
      try {
        const modelsResponse = await modelAPI.filterModels(selectedBrand, selectedType, null);
        setModels(modelsResponse || []);
      } catch (error) {
        console.error("Failed to fetch models:", error);
        toast({
          title: "Error",
          description: "Failed to load vehicle models",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setModels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [selectedBrand, selectedType, toast]);

  const clearFilters = () => {
    setSelectedBrand(null);
    setSelectedType(null);
  };

  return (
    <>
      <section className>
        <HeroPages name="Vehicle Models" />
        <div className="container">
          {/* Filters Section with CSS classes */}
          <motion.div 
            className="filters-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="filters-header">
              <h2 className="filters-title">Find Your Perfect Vehicle</h2>
              <p className="filters-subtitle">Filter by brand and type to find your ideal ride</p>
            </div>

            <motion.div 
              className="filters-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="filter-group">
                <div className="filter-input-wrapper">
                  <i className="fa-solid fa-car filter-icon"></i>
                  <motion.select
                    className="filter-select"
                    onChange={(e) => setSelectedBrand(e.target.value || null)}
                    value={selectedBrand || ''}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <option value="">All Brands</option>
                    {brands.map((b) => (
                      <option key={b.brandId} value={b.brandId}>
                        {b.name}
                      </option>
                    ))}
                  </motion.select>
                  <i className="fa-solid fa-chevron-down dropdown-arrow"></i>
                </div>
              </div>

              <div className="filter-group">
                <div className="filter-input-wrapper">
                  <i className="fa-solid fa-tag filter-icon"></i>
                  <motion.select
                    className="filter-select"
                    onChange={(e) => setSelectedType(e.target.value || null)}
                    value={selectedType || ''}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <option value="">All Types</option>
                    {types.map((t) => (
                      <option key={t.typeId} value={t.typeId}>
                        {t.name}
                      </option>
                    ))}
                  </motion.select>
                  <i className="fa-solid fa-chevron-down dropdown-arrow"></i>
                </div>
              </div>

              <motion.button
                className="clear-filters-btn"
                onClick={clearFilters}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fa-solid fa-rotate-left"></i>
                Clear Filters
              </motion.button>
            </motion.div>
          </motion.div>

          <div className="models-div">
            {loading ? (
              <motion.div 
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '200px',
                  fontSize: '18px',
                  color: '#666'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                Loading vehicle models...
              </motion.div>
            ) : models.length === 0 ? (
              <motion.div 
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '200px',
                  fontSize: '18px',
                  color: '#666'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                No vehicle models found. Try adjusting your filters.
              </motion.div>
            ) : (
              models.map((model, index) => (
                <motion.div 
                  className="models-div__box" 
                  key={model.modelId}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  whileHover={{ y: -8 }}
                >
                  <div className="models-div__box__img">
                    <motion.img 
                      src={model.imageUrl} 
                      alt={model.name}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    />
                    <div className="models-div__box__descr">
                      <div className="models-div__box__descr__name-price">
                        <div className="models-div__box__descr__name-price__name">
                          <p>{model.name}</p>
                          <span>
                            {[...Array(5)].map((_, i) => (
                              <i key={i} className="fa-solid fa-star"></i>
                            ))}
                          </span>
                        </div>
                        <div className="models-div__box__descr__name-price__price">
                          <h4>${model.pricePerHour}</h4>
                          <p>per hour</p>
                        </div>
                      </div>
                      <motion.div
                        className="models-div__box__descr__name-price__btn"
                        onClick={() => navigate(`/models/${model.modelId}`)}
                        style={{ cursor: "pointer", fontWeight: "bold", color: "white" }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Book Ride
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default Models;