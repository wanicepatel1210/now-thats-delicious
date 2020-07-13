import axios from 'axios';
import { $ } from './bling';

const mapOptions = {
  center: {
    lat: 43.2,
    lng: -79.8,
  },
  zoom: 10,
};

const loadPlaces = (map, lat = 43.2, lng = -79.8) => {
  axios.get(`api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => {
      const places = res.data;
      if (!places.length) {
        alert('no places found!');
        return;
      }

      // Create bounds
      const bounds = new google.maps.LatLngBounds();

      // Create popup
      const infoWindow = new google.maps.InfoWindow();

      // Create Marker for each place on Google Map
      const markers = places.map(place => {
        const [placeLng, placeLat] = place.location.coordinates;
        const position = { lat: placeLat, lng: placeLng };
        bounds.extend(position);
        const marker = new google.maps.Marker({ map, position });
        marker.place = place;
        return marker;
      });

      // When some click on a marker, show the details of that place
      markers.forEach(marker => marker.addListener('click', function () {
        console.log(this.place);
        const html = `
          <div className="popup">
            <a href="/store/${this.place.slug}" style="display: flex;">
              <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" style="flex: 1; max-width: 50%;"/>
              <div style="flex: 1; padding-left: 2%;">
                <p style="font-size: large; margin-top: 0;"><strong>${this.place.name}</strong></p>
                <p>${this.place.location.address}</p>
              </div>
            </a >
          </div>
        `;
        infoWindow.setContent(html);
        infoWindow.open(map, this);
      }));

      // Zoom the map to fit all the markers perfectly 
      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);
    });
};

const makeMap = (mapDiv) => {
  if (!mapDiv) return;
  // Create the map
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);
  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
  });
};

export default makeMap;