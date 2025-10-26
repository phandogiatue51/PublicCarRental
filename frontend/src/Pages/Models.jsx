import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
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
          <div className="filters-section">
            <div className="filters-header">
              <h2 className="filters-title">Find Your Perfect Vehicle</h2>
              <p className="filters-subtitle">Filter by brand and type to find your ideal ride</p>
            </div>
            
            <div className="filters-container">
              <div className="filter-group">
                <div className="filter-input-wrapper">
                  <i className="fa-solid fa-car filter-icon"></i>
                  <select 
                    className="filter-select"
                    onChange={(e) => setSelectedBrand(e.target.value || null)}
                    value={selectedBrand || ''}
                  >
                    <option value="">All Brands</option>
                    {brands.map((b) => (
                      <option key={b.brandId} value={b.brandId}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down dropdown-arrow"></i>
                </div>
              </div>

              <div className="filter-group">
                <div className="filter-input-wrapper">
                  <i className="fa-solid fa-tag filter-icon"></i>
                  <select 
                    className="filter-select"
                    onChange={(e) => setSelectedType(e.target.value || null)}
                    value={selectedType || ''}
                  >
                    <option value="">All Types</option>
                    {types.map((t) => (
                      <option key={t.typeId} value={t.typeId}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down dropdown-arrow"></i>
                </div>
              </div>

              <button 
                className="clear-filters-btn"
                onClick={clearFilters}
              >
                <i className="fa-solid fa-rotate-left"></i>
                Clear Filters
              </button>
            </div>
          </div>

          <div className="models-div">
            {loading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '200px',
                fontSize: '18px',
                color: '#666'
              }}>
                Loading vehicle models...
              </div>
            ) : models.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '200px',
                fontSize: '18px',
                color: '#666'
              }}>
                No vehicle models found. Try adjusting your filters.
              </div>
            ) : (
              models.map((model) => (
                <div className="models-div__box" key={model.modelId}>
                  <div className="models-div__box__img">
                    <img src={model.imageUrl} alt={model.name} />
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
                      <div className="models-div__box__descr__name-price__btn">
                        <Link onClick={() => window.scrollTo(0, 0)} to="/">
                          Book Ride
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
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