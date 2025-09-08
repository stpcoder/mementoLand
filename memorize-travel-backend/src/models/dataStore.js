// Simple in-memory data store for MVP
class DataStore {
  constructor() {
    this.trips = new Map();
    this.miniatures = new Map();
  }

  // Trip methods
  createTrip(tripData) {
    const trip = {
      id: tripData.id,
      name: tripData.name || `Trip ${this.trips.size + 1}`,
      backgroundImage: tripData.backgroundImage,
      currentBackground: tripData.currentBackground,
      originalBackground: tripData.backgroundImage, // Store the original empty background
      miniatures: [],
      segments: [], // Store accumulated segments
      segmentMapping: {}, // Map segment IDs to original images
      backgroundMusic: null, // Store the background music URL
      startDate: tripData.startDate || null,
      endDate: tripData.endDate || null,
      createdAt: new Date().toISOString()
    };
    this.trips.set(trip.id, trip);
    return trip;
  }

  getTrip(tripId) {
    return this.trips.get(tripId);
  }

  getAllTrips() {
    return Array.from(this.trips.values());
  }

  updateTrip(tripId, updates) {
    const trip = this.trips.get(tripId);
    if (!trip) return null;
    
    const updatedTrip = { ...trip, ...updates };
    this.trips.set(tripId, updatedTrip);
    return updatedTrip;
  }

  addMiniatureToTrip(tripId, miniature) {
    const trip = this.trips.get(tripId);
    if (!trip) return null;
    
    trip.miniatures.push(miniature);
    this.trips.set(tripId, trip);
    return trip;
  }

  // Segmentation methods
  updateTripSegments(tripId, newSegment, originalImage) {
    const trip = this.trips.get(tripId);
    if (!trip) return null;
    
    // Add new segment to accumulated segments
    if (newSegment) {
      trip.segments.push(newSegment);
      // Map segment ID to original image
      if (originalImage) {
        trip.segmentMapping[newSegment.id] = originalImage;
      }
    }
    
    this.trips.set(tripId, trip);
    return trip;
  }
  
  getTripSegments(tripId) {
    const trip = this.trips.get(tripId);
    if (!trip) return null;
    
    return {
      segments: trip.segments || [],
      segmentMapping: trip.segmentMapping || {}
    };
  }

  // Miniature methods
  createMiniature(miniatureData) {
    const miniature = {
      id: miniatureData.id,
      tripId: miniatureData.tripId,
      originalImage: miniatureData.originalImage,
      miniatureImage: miniatureData.miniatureImage,
      addedAt: new Date().toISOString()
    };
    this.miniatures.set(miniature.id, miniature);
    return miniature;
  }

  getMiniature(miniatureId) {
    return this.miniatures.get(miniatureId);
  }

  getMiniaturesByTrip(tripId) {
    return Array.from(this.miniatures.values()).filter(m => m.tripId === tripId);
  }

  // Utility methods
  clear() {
    this.trips.clear();
    this.miniatures.clear();
  }

  getStats() {
    return {
      totalTrips: this.trips.size,
      totalMiniatures: this.miniatures.size
    };
  }
}

// Export singleton instance
module.exports = new DataStore();