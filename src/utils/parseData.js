function transformServiceData(input) {
    return {
        title: input.serviceName || "Untitled Service",
        description: input.description || "",
        category: input.serviceType ? input.serviceType.toLowerCase() : "general",
        price: 100, // Placeholder value – since price is not provided
        currency: "USD", // You could localize this based on country
        location: {
            city: input.userAddress?.city || "",
            state: input.userAddress?.state || "",
            coordinates: {
                lat: input.geoLocation?.latitude || 0,
                lng: input.geoLocation?.longitude || 0,
                type: "Point",
                coordinates: [
                    input.geoLocation?.longitude || 0,
                    input.geoLocation?.latitude || 0
                ]
            }
        },
        sellerId: "seller_" + input.username.toLowerCase(), // Simulated seller ID
        availability: {
            days: ["Fri", "Sat", "Sun"], // Placeholder - no availability in input
            timeSlots: ["10:00-18:00"]   // Placeholder
        },
        images: input.portfolio?.flatMap(p => p.media?.map(m => m.url)) || [],
        tags: input.searchTags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

module.exports = transformServiceData