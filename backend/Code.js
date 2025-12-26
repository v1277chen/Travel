/**
 * Code.js
 * API 進入點與路由分發
 */

function doGet(e) {
    if (!e.parameter.action) {
        return HtmlService.createTemplateFromFile('frontend/Index')
            .evaluate()
            .setTitle('Travel Planner')
            .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
            .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }
    return handleRequest(e);
}

function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Exposed to google.script.run
 */
function apiRunner(action, payload) {
    var e = {
        parameter: { action: action },
        postData: { contents: JSON.stringify(payload) }
    };
    var result = handleRequest(e);
    return result.getContent();
}

function doPost(e) {
    return handleRequest(e);
}

function handleRequest(e) {
    try {
        var action = e.parameter.action;
        var method = e.parameter.method || (e.postData ? 'POST' : 'GET'); // Allow method override

        // Parse body for POST requests
        var body = e.postData ? parseRequestBody(e) : {};

        // 路由分發
        switch (action) {
            case 'ping':
                return createSuccessResponse({ message: 'pong', timestamp: new Date() });

            // User Actions
            case 'login': // 簡化版登入，實務上應驗證 token
                // req: {email, password}
                var user = Models.Users.findByEmail(body.email);
                if (user && user.password_hash === body.password) { // 警告: 密碼應 Hash 比對
                    return createSuccessResponse(user);
                }
                return createErrorResponse('Invalid credentials', 401);

            case 'register':
                // req: {email, password, display_name...}
                var existing = Models.Users.findByEmail(body.email);
                if (existing) return createErrorResponse('User already exists', 400);
                var newUser = Models.Users.create(body);
                return createSuccessResponse(newUser);

            // Trip Actions
            case 'getTrips':
                // req: owner_id
                var ownerId = e.parameter.owner_id;
                if (!ownerId) return createErrorResponse('Missing owner_id', 400);
                var trips = Models.Trips.findByOwner(ownerId);
                return createSuccessResponse(trips);

            case 'getTripDetails':
                // req: trip_id
                var tripId = e.parameter.trip_id;
                if (!tripId) return createErrorResponse('Missing trip_id', 400);
                var trip = Models.Trips.findById(tripId);
                if (!trip) return createErrorResponse('Trip not found', 404);

                // 撈取行程細項
                var items = Models.ItineraryItems.findByTripId(tripId);
                trip.items = items;

                return createSuccessResponse(trip);

            case 'createTrip':
                // req: {owner_id, title, ...}
                var newTrip = Models.Trips.create(body);
                return createSuccessResponse(newTrip);

            case 'updateTrip':
                // req: {id, title, ...}
                var tripId = body.id;
                if (!tripId) return createErrorResponse('Missing trip_id', 400);
                var success = Models.Trips.update(tripId, body);
                if (success) return createSuccessResponse({ success: true });
                return createErrorResponse('Update failed', 500);

            case 'deleteTrip':
                // req: trip_id
                var tripId = e.parameter.trip_id || body.trip_id;
                if (!tripId) return createErrorResponse('Missing trip_id', 400);

                // Cascade delete items
                Models.ItineraryItems.deleteByTripId(tripId);

                // Delete trip
                var success = Models.Trips.delete(tripId);
                if (success) return createSuccessResponse({ success: true });
                return createErrorResponse('Delete failed', 500);

            // Itinerary Actions
            case 'addItineraryItem':
                var newItem = Models.ItineraryItems.create(body);
                return createSuccessResponse(newItem);

            case 'deleteItineraryItem':
                // req: id
                var itemId = e.parameter.id || body.id;
                if (!itemId) return createErrorResponse('Missing item_id', 400);
                var success = Models.ItineraryItems.delete(itemId);
                if (success) return createSuccessResponse({ success: true });
                return createErrorResponse('Delete failed', 500);

            case 'updateItineraryItem':
                var itemId = body.id;
                var success = Models.ItineraryItems.update(itemId, body);
                if (success) return createSuccessResponse({ success: true });
                return createErrorResponse('Update failed', 500);

            default:
                return createErrorResponse('Unknown action: ' + action, 404);
        }

    } catch (error) {
        return createErrorResponse(error.toString(), 500);
    }
}
