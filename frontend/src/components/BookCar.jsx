import { useEffect, useState } from "react";
import { modelAPI } from "../services/api";
import CarAudi from "../images/cars-big/audia1.jpg";
import CarGolf from "../images/cars-big/golf6.jpg";
import CarToyota from "../images/cars-big/toyotacamry.jpg";
import CarBmw from "../images/cars-big/bmw320.jpg";
import CarMercedes from "../images/cars-big/benz.jpg";
import CarPassat from "../images/cars-big/passatcc.jpg";

function BookCar() {
  const [modal, setModal] = useState(false); //  class - active-modal

  // booking car (refactored to model + station + start/end)
  const [modelId, setModelId] = useState("");
  const [models, setModels] = useState([]);
  const [stationId, setStationId] = useState("");
  const [stations, setStations] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [carImg, setCarImg] = useState("");

  // modal infos
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipcode, setZipCode] = useState("");

  // taking value of modal inputs
  const handleName = (e) => {
    setName(e.target.value);
  };

  const handleLastName = (e) => {
    setLastName(e.target.value);
  };

  const handlePhone = (e) => {
    setPhone(e.target.value);
  };

  const handleAge = (e) => {
    setAge(e.target.value);
  };

  const handleEmail = (e) => {
    setEmail(e.target.value);
  };

  const handleAddress = (e) => {
    setAddress(e.target.value);
  };

  const handleCity = (e) => {
    setCity(e.target.value);
  };

  const handleZip = (e) => {
    setZipCode(e.target.value);
  };

  // open modal when all inputs are fulfilled
  const openModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const errorMsg = document.querySelector(".error-message");
    if (
      modelId === "" ||
      stationId === "" ||
      startDate === "" ||
      endDate === ""
    ) {
      errorMsg.style.display = "flex";
    } else {
      setModal(!modal);
      const modalDiv = document.querySelector(".booking-modal");
      if (modalDiv) {
        modalDiv.scroll(0, 0);
      }
      errorMsg.style.display = "none";
    }
  };

  // disable page scroll when modal is displayed
  useEffect(() => {
    if (modal === true) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [modal]);

  // confirm modal booking
  const confirmBooking = (e) => {
    e.preventDefault();
    setModal(!modal);
    const doneMsg = document.querySelector(".booking-done");
    doneMsg.style.display = "flex";
  };

  // taking value of booking inputs
  const handleModel = (e) => {
    e.stopPropagation();
    const selected = e.target.value;
    setModelId(selected);
  };

  const handleStation = (e) => {
    e.stopPropagation();
    setStationId(e.target.value);
  };

  const handleStartDate = (e) => {
    e.stopPropagation();
    setStartDate(e.target.value);
  };

  const handleEndDate = (e) => {
    e.stopPropagation();
    setEndDate(e.target.value);
  };

  // based on value name show car img
  let imgUrl;
  switch (carImg) {
    case "Audi A1 S-Line":
      imgUrl = CarAudi;
      break;
    case "VW Golf 6":
      imgUrl = CarGolf;
      break;
    case "Toyota Camry":
      imgUrl = CarToyota;
      break;
    case "BMW 320 ModernLine":
      imgUrl = CarBmw;
      break;
    case "Mercedes-Benz GLK":
      imgUrl = CarMercedes;
      break;
    case "VW Passat CC":
      imgUrl = CarPassat;
      break;
    default:
      imgUrl = "";
  }

  // hide message
  const hideMessage = () => {
    const doneMsg = document.querySelector(".booking-done");
    doneMsg.style.display = "none";
  };

  // derive selected names for display
  const selectedStation = stations.find(
    (s) => String(s.stationId) === String(stationId)
  );
  const selectedStationName = selectedStation?.name || "";
  const selectedModel = models.find(
    (m) => String(m.modelId || m.id) === String(modelId)
  );
  const selectedModelName = selectedModel?.name || "";

  // load models once
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await modelAPI.getAll();
        const list = Array.isArray(data?.result) ? data.result : (Array.isArray(data) ? data : []);
        setModels(list);
      } catch (err) {
        console.error("Failed to load models", err);
      }
    };
    fetchModels();
  }, []);

  // load stations when model changes
  useEffect(() => {
    const fetchStations = async () => {
      if (!modelId) {
        setStations([]);
        setStationId("");
        return;
      }
      try {
        const list = await modelAPI.getStationFromModel(parseInt(modelId));
        setStations(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to load stations for model", err);
        setStations([]);
      }
    };
    fetchStations();
  }, [modelId]);

  return (
    <>
      <section id="booking-section" className="book-section">
        {/* overlay - only render when modal is active */}
        {modal && (
          <div
            onClick={openModal}
            className="modal-overlay active-modal"
          ></div>
        )}

        <div className="container">
          <div className="book-content">
            <div className="book-content__box">
              <h2>Book a car</h2>

              <p className="error-message">
                All fields required! <i className="fa-solid fa-xmark"></i>
              </p>

              <p className="booking-done">
                Check your email to confirm an order.{" "}
                <i onClick={hideMessage} className="fa-solid fa-xmark"></i>
              </p>

              <form className="box-form">
                  <div className="box-form__car-type">
                    <label>
                      <i className="fa-solid fa-car"></i> &nbsp;Pick Model <b>*</b>
                    </label>
                    <select value={modelId} onChange={handleModel}>
                      <option value="">Pick model</option>
                      {models.map((m, idx) => (
                        <option key={idx} value={String(m.modelId || m.id)}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="box-form__car-type">
                    <label>
                      <i className="fa-solid fa-location-dot"></i> &nbsp; Pick Station <b>*</b>
                    </label>
                    <select value={stationId} onChange={handleStation} disabled={!modelId}>
                      <option value="">{modelId ? "Pick station" : "Pick trước"}</option>
                      {stations.map((s, idx) => (
                        <option key={idx} value={String(s.stationId)}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="box-form__car-time">
                    <label htmlFor="startDate">
                      <i className="fa-regular fa-calendar-days "></i> &nbsp; Start date <b>*</b>
                    </label>
                    <input
                      id="startDate"
                      value={startDate}
                      onChange={handleStartDate}
                      type="datetime-local"
                    ></input>
                  </div>

                  <div className="box-form__car-time">
                    <label htmlFor="endDate">
                      <i className="fa-regular fa-calendar-days "></i> &nbsp; End date <b>*</b>
                    </label>
                    <input
                      id="endDate"
                      value={endDate}
                      onChange={handleEndDate}
                      type="datetime-local"
                      min={startDate || undefined}
                    ></input>
                  </div>
                  <button
                    onClick={openModal}
                    type="submit"
                    style={{ gridColumn: "1 / -1", justifySelf: "center", width: "320px", marginTop: "0.5rem" }}
                  >
                    Search
                  </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* modal ------------------------------------ */}

      <div className={`booking-modal ${modal ? "active-modal" : ""}`}>
        {/* title */}
        <div className="booking-modal__title">
          <h2>Complete Reservation</h2>
          <i onClick={openModal} className="fa-solid fa-xmark"></i>
        </div>
        {/* message */}
        <div className="booking-modal__message">
          <h4>
            <i className="fa-solid fa-circle-info"></i> Upon completing this
            reservation enquiry, you will receive:
          </h4>
          <p>
            Your rental voucher to produce on arrival at the rental desk and a
            toll-free customer support number.
          </p>
        </div>
        {/* car info */}
        <div className="booking-modal__car-info">
          <div className="dates-div">
            <div className="booking-modal__car-info__dates">
              <h5>Location & Date</h5>
              <span>
                <i className="fa-solid fa-location-dot"></i>
                <div>
                  <h6>Pick-Up Date & Time</h6>
                  <p>
                    {startDate} /{" "}
                    <input type="time" className="input-time"></input>
                  </p>
                </div>
              </span>
            </div>

            <div className="booking-modal__car-info__dates">
              <span>
                <i className="fa-solid fa-location-dot"></i>
                <div>
                  <h6>Drop-Off Date & Time</h6>
                  <p>
                    {endDate} /{" "}
                    <input type="time" className="input-time"></input>
                  </p>
                </div>
              </span>
            </div>

            <div className="booking-modal__car-info__dates">
              <span>
                <i className="fa-solid fa-calendar-days"></i>
                <div>
                  <h6>Pick-Up Station</h6>
                  <p>{selectedStationName}</p>
                </div>
              </span>
            </div>

            <div className="booking-modal__car-info__dates">
              <span>
                <i className="fa-solid fa-calendar-days"></i>
                <div>
                  <h6>Drop-Off Station</h6>
                  <p>{selectedStationName}</p>
                </div>
              </span>
            </div>
          </div>
          <div className="booking-modal__car-info__model">
            <h5>
              <span>Car -</span> {selectedModelName}
            </h5>
            {imgUrl && <img src={imgUrl} alt="car_img" />}
          </div>
        </div>
        {/* personal info */}
        <div className="booking-modal__person-info">
          <h4>Personal Information</h4>
          <form className="info-form">
            <div className="info-form__2col">
              <span>
                <label>
                  First Name <b>*</b>
                </label>
                <input
                  value={name}
                  onChange={handleName}
                  type="text"
                  placeholder="Enter your first name"
                ></input>
                <p className="error-modal">This field is required.</p>
              </span>

              <span>
                <label>
                  Last Name <b>*</b>
                </label>
                <input
                  value={lastName}
                  onChange={handleLastName}
                  type="text"
                  placeholder="Enter your last name"
                ></input>
                <p className="error-modal ">This field is required.</p>
              </span>

              <span>
                <label>
                  Phone Number <b>*</b>
                </label>
                <input
                  value={phone}
                  onChange={handlePhone}
                  type="tel"
                  placeholder="Enter your phone number"
                ></input>
                <p className="error-modal">This field is required.</p>
              </span>

              <span>
                <label>
                  Age <b>*</b>
                </label>
                <input
                  value={age}
                  onChange={handleAge}
                  type="number"
                  placeholder="18"
                ></input>
                <p className="error-modal ">This field is required.</p>
              </span>
            </div>

            <div className="info-form__1col">
              <span>
                <label>
                  Email <b>*</b>
                </label>
                <input
                  value={email}
                  onChange={handleEmail}
                  type="email"
                  placeholder="Enter your email address"
                ></input>
                <p className="error-modal">This field is required.</p>
              </span>

              <span>
                <label>
                  Address <b>*</b>
                </label>
                <input
                  value={address}
                  onChange={handleAddress}
                  type="text"
                  placeholder="Enter your street address"
                ></input>
                <p className="error-modal ">This field is required.</p>
              </span>
            </div>

            <div className="info-form__2col">
              <span>
                <label>
                  City <b>*</b>
                </label>
                <input
                  value={city}
                  onChange={handleCity}
                  type="text"
                  placeholder="Enter your city"
                ></input>
                <p className="error-modal">This field is required.</p>
              </span>

              <span>
                <label>
                  Zip Code <b>*</b>
                </label>
                <input
                  value={zipcode}
                  onChange={handleZip}
                  type="text"
                  placeholder="Enter your zip code"
                ></input>
                <p className="error-modal ">This field is required.</p>
              </span>
            </div>

            <span className="info-form__checkbox">
              <input type="checkbox"></input>
              <p>Please send me latest news and updates</p>
            </span>

            <div className="reserve-button">
              <button onClick={confirmBooking}>Reserve Now</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default BookCar;
