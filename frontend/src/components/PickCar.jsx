import { useState, useEffect, useRef } from "react";
import CarBox from "./CarBox";
import { modelAPI } from "../services/api";
import "../styles/CarHome.css";

function PickCar() {
  const [active, setActive] = useState(0);
  const [colorBtn, setColorBtn] = useState("btn0");
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

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

  // Initialize scroll position to center the first real item in middle copy
  useEffect(() => {
    if (models.length > 0 && scrollContainerRef.current) {
      setTimeout(() => {
        // Scroll to the middle of the middle copy to start centered
        const container = scrollContainerRef.current;
        const carButtons = container.querySelectorAll('.vertical-model-btn');
        const middleCopyStartIndex = models.length; // Start of middle copy
        
        if (carButtons[middleCopyStartIndex]) {
          const containerHeight = container.clientHeight;
          const buttonHeight = carButtons[middleCopyStartIndex].offsetHeight;
          const buttonOffsetTop = carButtons[middleCopyStartIndex].offsetTop;
          
          const scrollTop = buttonOffsetTop - (containerHeight / 2) + (buttonHeight / 2);
          
          container.scrollTo({
            top: scrollTop,
            behavior: 'auto'
          });
        }
      }, 100);
    }
  }, [models.length]);

  // Sync colorBtn with active state
  useEffect(() => {
    setColorBtn(`btn${active}`);
  }, [active]);

  // Add wheel scroll navigation for infinite carousel
  useEffect(() => {
    const handleWheel = (event) => {
      if (models.length === 0 || isScrollingRef.current) return;
      
      event.preventDefault();
      isScrollingRef.current = true;
      
      if (event.deltaY > 0) {
        // Scroll down - go to next
        navigateToNext();
      } else {
        // Scroll up - go to previous
        navigateToPrevious();
      }
      
      // Reset scroll lock after animation
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 300);
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [active, models.length]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (models.length === 0) return;
      
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          navigateToPrevious();
          break;
        case 'ArrowDown':
          event.preventDefault();
          navigateToNext();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [active, models.length]);

  const btnID = (id) => {
    setColorBtn(colorBtn === id ? "" : id);
  };

  const coloringButton = (id) => {
    return colorBtn === id ? "colored-button" : "";
  };

  // Function to check if a button should be highlighted based on active state
  const isButtonActive = (displayIndex) => {
    // Use forceUpdate to ensure re-render after loop transitions
    const _ = forceUpdate; // This ensures the function re-runs when forceUpdate changes
    return active === displayIndex;
  };

  // Function to center the selected car in the container
  const scrollToCar = (targetIndex) => {
    if (!scrollContainerRef.current || models.length === 0) return;

    const container = scrollContainerRef.current;
    const carButtons = container.querySelectorAll('.vertical-model-btn');
    
    // Find the button with the target original index in the middle copy
    const targetButton = Array.from(carButtons).find(button => {
      const buttonIndex = Array.from(carButtons).indexOf(button);
      const modelIndex = Math.floor(buttonIndex / models.length);
      const itemIndex = buttonIndex % models.length;
      return modelIndex === 1 && itemIndex === targetIndex; // Middle copy (index 1)
    });
    
    if (!targetButton) return;

    // Calculate scroll position to center the selected car
    const containerHeight = container.clientHeight;
    const buttonHeight = targetButton.offsetHeight;
    const buttonOffsetTop = targetButton.offsetTop;
    
    // Center the button in the container
    const scrollTop = buttonOffsetTop - (containerHeight / 2) + (buttonHeight / 2);
    
    // Smooth scroll to the calculated position
    container.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
  };

  // Function to handle car selection
  const handleCarSelection = (index) => {
    setActive(index);
    
    // Trigger smooth scroll after a short delay to ensure DOM is updated
    setTimeout(() => {
      scrollToCar(index);
    }, 50);
  };

  // Function to handle seamless infinite scroll
  const handleSeamlessScroll = (newIndex) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Just center the selected item, no position reset needed
    setTimeout(() => {
      scrollToCar(newIndex);
      setForceUpdate(prev => prev + 1);
      setIsTransitioning(false);
    }, 300);
  };

  // Function to force re-center and re-highlight after loop transition
  const forceRecenter = (index) => {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollToCar(index);
        setForceUpdate(prev => prev + 1);
      }
    }, 100);
  };

  // Function to handle infinite navigation with true infinite scroll
  const navigateToNext = () => {
    const nextIndex = (active + 1) % models.length;
    setActive(nextIndex);
    
    scrollToCar(nextIndex);
    
    // Handle seamless scroll for all transitions
    handleSeamlessScroll(nextIndex);
  };

  const navigateToPrevious = () => {
    const prevIndex = active === 0 ? models.length - 1 : active - 1;
    setActive(prevIndex);
    
    scrollToCar(prevIndex);
    
    // Handle seamless scroll for all transitions
    handleSeamlessScroll(prevIndex);
  };

  // Create looped models array for true infinite scroll
  const createLoopedModels = () => {
    if (models.length === 0) return [];
    
    // Create multiple copies for true infinite scroll
    const copies = 3; // Number of copies to create
    const allCopies = [];
    
    for (let i = 0; i < copies; i++) {
      allCopies.push(...models.map((model, index) => ({
        ...model,
        originalIndex: index, // Keep track of original index
        copyIndex: i
      })));
    }
    
    return allCopies;
  };

  const loopedModels = createLoopedModels();
  const offset = models.length; // Offset for first copy (middle position)

  // Transform all models to match CarBox expected format
  const transformedData = models.map(model => ([{
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


  if (loading) {
    return <div className="loading">Loading vehicles...</div>;
  }

  if (models.length === 0) {
    return <div className="no-vehicles">No vehicles available.</div>;
  }

  return (
    <>
      <style jsx>{`
        .infinite-carousel::-webkit-scrollbar {
          display: none;
        }
        .infinite-carousel {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
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
            

            <div className="pick-container__car-content">
              {/* Vertical Carousel Container */}
              <div className="vertical-carousel-container">
                {/* Car selection buttons - Vertical layout */}
                <div 
                  className="vertical-pick-box infinite-carousel" 
                  ref={scrollContainerRef}
                  style={{
                    overflowY: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    height: '500px', // Fixed height to match CarBox
                    maxHeight: '500px'
                  }}
                >
                  {loopedModels.map((model, index) => {
                    const displayIndex = model.originalIndex; // Use original index from the model
                    
                    return (
                      <button
                        key={`${model.modelId}-${index}-${model.copyIndex}`}
                        className={`vertical-model-btn ${isButtonActive(displayIndex) ? "colored-button" : ""}`}
                        onClick={() => handleCarSelection(displayIndex)}
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
                    );
                  })}
                </div>

                {/* Car display area */}
                <div 
                  className="vertical-car-display"
                  style={{
                    height: '500px', // Match the height of vertical-pick-box
                    maxHeight: '500px',
                    overflowY: 'auto'
                  }}
                >

                  {/* Display CarBox with transformed data */}
                  <div className="vertical-car-showcase">
                    <CarBox 
                      data={transformedData} 
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