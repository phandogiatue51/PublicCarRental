import { useState, useEffect } from "react";
import CarBox from "./CarBox";
import { modelAPI } from "../services/api";
import "../styles/CarHome.css";

function PickCar() {
  const [active, setActive] = useState(0);
  const [colorBtn, setColorBtn] = useState("btn0");
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const modelsPerPage = 5;

  useEffect(() => {
    // Fetch all models from API
    const fetchModels = async () => {
      try {
        const modelsData = await modelAPI.getAll();
        setModels(modelsData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch models", error);
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  const btnID = (id) => {
    setColorBtn(colorBtn === id ? "" : id);
  };

  const coloringButton = (id) => {
    return colorBtn === id ? "colored-button" : "";
  };

  // Transform all models to match CarBox expected format
  const safeModels = Array.isArray(models) ? models : [];
  const transformedData = safeModels.map(model => ([{
    name: model.name,
    price: model.pricePerHour,
    mark: model.brandName,
    model: model.name,
    year: "2023",
    doors: "4",
    air: "Yes",
    transmission: "Automatic",
    fuel: "Electric",
    img: model.imageUrl
  }]));

  // Get current page models
  const currentModels = safeModels.slice(
    currentPage * modelsPerPage,
    (currentPage + 1) * modelsPerPage
  );

  const totalPages = Math.ceil(safeModels.length / modelsPerPage);

  const nextPage = () => {
    if ((currentPage + 1) * modelsPerPage < safeModels.length) {
      setCurrentPage(currentPage + 1);
      setActive(0); // Reset to first model on new page
      setColorBtn("btn0");
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setActive(0); // Reset to first model on new page
      setColorBtn("btn0");
    }
  };

  const nextModel = () => {
    if (active < currentModels.length - 1) {
      setActive(active + 1);
      setColorBtn(`btn${active + 1}`);
    }
  };

  const prevModel = () => {
    if (active > 0) {
      setActive(active - 1);
      setColorBtn(`btn${active - 1}`);
    }
  };

  if (loading) {
    return <div className="loading">Loading vehicles...</div>;
  }

  if (safeModels.length === 0) {
    return <div className="no-vehicles">No vehicles available.</div>;
  }

  return (
    <>
      <section className="pick-section">
        <div className="container">
          <div className="pick-container">
            <div className="pick-container__title">
              <h3>Vehicle Models</h3>
              <h2>Our rental fleet</h2>
              <p>
                Choose from a variety of our amazing vehicles to rent for your
                next adventure or business trip
              </p>
            </div>

            {/* Page Navigation */}
            <div className="page-navigation">
              <button
                className="nav-btn prev-page-btn"
                onClick={prevPage}
                disabled={currentPage === 0}
              >
                <i className="fa-solid fa-chevron-left"></i>
                Previous Page
              </button>

              <span className="page-indicator">
                Page {currentPage + 1} of {totalPages}
              </span>

              <button
                className="nav-btn next-page-btn"
                onClick={nextPage}
                disabled={(currentPage + 1) * modelsPerPage >= safeModels.length}
              >
                Next Page
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>

            <div className="pick-container__car-content">
              {/* Vertical Carousel Container */}
              <div className="vertical-carousel-container">
                {/* Car selection buttons - Vertical layout */}
                <div className="vertical-pick-box">
                  {currentModels.map((model, index) => (
                    <button
                      key={model.modelId}
                      className={`vertical-model-btn ${coloringButton(`btn${index}`)}`}
                      onClick={() => {
                        setActive(index);
                        btnID(`btn${index}`);
                      }}
                    >
                      <div className="model-btn-content">
                        <div className="model-btn-image">
                          <img src={model.imageUrl} alt={model.name} />
                        </div>
                        <div className="model-btn-info">
                          <span className="model-name">{model.name}</span>
                          <span className="model-brand">{model.brandName}</span>
                          <span className="model-price">${model.pricePerHour}/hr</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Car display area */}
                <div className="vertical-car-display">
                  {/* Model Navigation */}
                  <div className="vertical-model-navigation">
                    <button
                      className="vertical-nav-btn"
                      onClick={prevModel}
                      disabled={active === 0}
                    >
                      <i className="fa-solid fa-chevron-up"></i>
                    </button>

                    <span className="vertical-model-indicator">
                      {active + 1} / {currentModels.length}
                    </span>

                    <button
                      className="vertical-nav-btn"
                      onClick={nextModel}
                      disabled={active === currentModels.length - 1}
                    >
                      <i className="fa-solid fa-chevron-down"></i>
                    </button>
                  </div>

                  {/* Display CarBox with transformed data */}
                  <div className="vertical-car-showcase">
                    <CarBox
                      data={transformedData.slice(
                        currentPage * modelsPerPage,
                        (currentPage + 1) * modelsPerPage
                      )}
                      carID={active}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default PickCar;