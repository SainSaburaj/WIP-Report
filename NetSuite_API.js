import { ENV_VAR } from "../shared/constants";
import { ref } from "vue";
// Define the endpoints for various API calls
const END_POINTS = {
    // List All Customers  
    SLABWISE_REPORTS: {
        endpointName: "REPORTS_APP_ENDPOINT",
        apiType: "slabwisereports",
        name: "SLABWISE_REPORTS",
    },
    // List locations
    LIST_LOCATIONS: {
        endpointName: "REPORTS_APP_ENDPOINT",
        apiType: "listLocations",
        name: "LIST_LOCATIONS",
    },
    // Actual WIP Report
    ACTUAL_WIP: {
        endpointName: "REPORTS_APP_ENDPOINT",
        apiType: "actualwip",
        name: "ACTUAL_WIP",
    },
    // Actual WIP Report - department-level summary (one row per department,
    // quantity/weight columns SUMmed). Loaded initially instead of the full
    // detail set.
    ACTUAL_WIP_SUMMARY: {
        endpointName: "REPORTS_APP_ENDPOINT",
        apiType: "actualwipsummary",
        name: "ACTUAL_WIP_SUMMARY",
    },
    // Actual WIP Report - full detail rows for a single department (on-demand
    // expansion of one summary row).
    ACTUAL_WIP_DEPARTMENT_DETAIL: {
        endpointName: "REPORTS_APP_ENDPOINT",
        apiType: "actualwipdepartmentdetail",
        name: "ACTUAL_WIP_DEPARTMENT_DETAIL",
    },
    // Manufacturing departments (each joined to its location) for the
    // Actual WIP Report's Location and Department filter dropdowns
    MANUFACTURING_DEPARTMENTS: {
        endpointName: "REPORTS_APP_ENDPOINT",
        apiType: "manufacturingdepartments",
        name: "MANUFACTURING_DEPARTMENTS",
    },
};

export function useAllReportsApi() {
    const loading = ref(false);
    const error = ref(null);
    const listLocationsData = ref([]); // Store the list of locations
    const slabwiseData = ref([]); // Store slabwise data
    const actualWipData = ref({ data: [], pageSize: 20, hasNext: false, hasPrev: false, firstId: null, lastId: null, totalCount: null, totalPages: null }); // Store Actual WIP report page
    const manufacturingDepartments = ref([]); // Store {departmentId, departmentName, locationId, locationName} rows for the Location/Department filters
    const actualWipSummary = ref({ data: [] }); // Store department-level summary rows for the Actual WIP report

    // Fetch locations data
    const listLocations = async (data) => {
        try {
            loading.value = true;
            error.value = null;
            const endpoint = "LIST_LOCATIONS";
            const response = await fetch(generateEndPoint(endpoint, END_POINTS), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const responseJson = await response.json();

            if (responseJson && responseJson.status === "SUCCESS" && responseJson.data) {
                responseJson.data = unwrapInEscapedBody(responseJson.data);
                listLocationsData.value = responseJson.data; // Save data to the ref
            } else {
                throw new Error(responseJson.message || "Failed to fetch locations");
            }
        } catch (err) {
            error.value = err.message;
            console.error("Error fetching locations:", err);
        } finally {
            loading.value = false;
        }
    };

    // Fetch slabwise data
    const fetchSlabwiseData = async (data) => {
        try {
            loading.value = true;
            error.value = null;
            const endpoint = "SLABWISE_REPORTS";
            const response = await fetch(generateEndPoint(endpoint, END_POINTS), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const responseJson = await response.json();

            if (responseJson && responseJson.status === "SUCCESS" && responseJson.data) {
                responseJson.data = unwrapInEscapedBody(responseJson.data);
                slabwiseData.value = responseJson.data; // Save slabwise data to the ref
            } else {
                throw new Error(responseJson.message || "Failed to fetch slabwise reports");
            }
        } catch (err) {
            error.value = err.message;
            console.error("Error fetching slabwise data:", err);
        } finally {
            loading.value = false;
        }
    };

    // Fetch a page of Actual WIP report data using keyset (seek) pagination.
    // options: { pageSize, cursorId, direction: 'next'|'prev', filters }
    const fetchActualWipData = async (data, options = {}) => {
        const { pageSize, cursorId, direction, filters } = options;
        try {
            loading.value = true;
            error.value = null;
            const endpoint = "ACTUAL_WIP";
            let url = generateEndPoint(endpoint, END_POINTS);
            if (pageSize) { url += `&pageSize=${encodeURIComponent(pageSize)}`; }
            if (cursorId) { url += `&cursorId=${encodeURIComponent(cursorId)}`; }
            if (direction) { url += `&direction=${encodeURIComponent(direction)}`; }
            if (filters) {
                Object.keys(filters).forEach((key) => {
                    const value = filters[key];
                    if (value) { url += `&${key}=${encodeURIComponent(value)}`; }
                });
            }
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const responseJson = await response.json();

            if (responseJson && responseJson.status === "SUCCESS" && responseJson.data) {
                responseJson.data = unwrapInEscapedBody(responseJson.data);
                actualWipData.value = responseJson.data;
            } else {
                actualWipData.value = { data: [], pageSize: pageSize || 20, hasNext: false, hasPrev: false, firstId: null, lastId: null, totalCount: null, totalPages: null };
                throw new Error(responseJson.message || "Failed to fetch Actual WIP report");
            }
        } catch (err) {
            error.value = err.message;
            console.error("Error fetching Actual WIP report:", err);
        } finally {
            loading.value = false;
        }
    };

    // Fetch the department-level SUMMARY of the Actual WIP report (one row per
    // department, quantity/weight columns SUMmed). options: { filters }
    const fetchActualWipSummary = async (options = {}) => {
        const { filters } = options;
        try {
            loading.value = true;
            error.value = null;
            const endpoint = "ACTUAL_WIP_SUMMARY";
            let url = generateEndPoint(endpoint, END_POINTS);
            if (filters) {
                Object.keys(filters).forEach((key) => {
                    const value = filters[key];
                    if (value) { url += `&${key}=${encodeURIComponent(value)}`; }
                });
            }
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });

            const responseJson = await response.json();

            if (responseJson && responseJson.status === "SUCCESS" && responseJson.data) {
                responseJson.data = unwrapInEscapedBody(responseJson.data);
                actualWipSummary.value = responseJson.data;
            } else {
                // NO_ACTUAL_WIP_FOUND is a valid empty result, not a hard error.
                actualWipSummary.value = (responseJson && responseJson.data)
                    ? unwrapInEscapedBody(responseJson.data)
                    : { data: [] };
                if (responseJson && responseJson.reason === "ERROR") {
                    throw new Error(responseJson.message || "Failed to fetch Actual WIP summary");
                }
            }
        } catch (err) {
            error.value = err.message;
            console.error("Error fetching Actual WIP summary:", err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Fetch the full detail rows for a single department (on-demand expansion
    // of one summary row). options: { department, filters }
    // Returns the detail array directly (does not mutate a shared ref) so
    // multiple departments can be expanded independently without clobbering
    // each other.
    const fetchActualWipDepartmentDetail = async (options = {}) => {
        const { department, filters } = options;
        const endpoint = "ACTUAL_WIP_DEPARTMENT_DETAIL";
        let url = generateEndPoint(endpoint, END_POINTS);
        if (department) { url += `&department=${encodeURIComponent(department)}`; }
        if (filters) {
            Object.keys(filters).forEach((key) => {
                // department is supplied explicitly above; don't let a filter
                // department override the expanded one.
                if (key === 'department') { return; }
                const value = filters[key];
                if (value) { url += `&${key}=${encodeURIComponent(value)}`; }
            });
        }
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });

        const responseJson = await response.json();

        if (responseJson && responseJson.data) {
            const data = unwrapInEscapedBody(responseJson.data);
            return (data && data.data) || [];
        }
        return [];
    };

    // Fetch manufacturing departments (joined to their location) for the
    // Actual WIP Report's Location and Department filters
    const fetchManufacturingDepartments = async () => {
        try {
            const endpoint = "MANUFACTURING_DEPARTMENTS";
            const response = await fetch(generateEndPoint(endpoint, END_POINTS), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });

            const responseJson = await response.json();

            if (responseJson && responseJson.status === "SUCCESS" && responseJson.data) {
                manufacturingDepartments.value = unwrapInEscapedBody(responseJson.data) || [];
            }
        } catch (err) {
            console.error("Error fetching manufacturing departments:", err);
        }
    };

    return {
        listLocations, // Export the listLocations function
        fetchSlabwiseData, // Export the fetchSlabwiseData function
        fetchActualWipData, // Export the fetchActualWipData function
        fetchActualWipSummary, // Export the department-summary fetch
        fetchActualWipDepartmentDetail, // Export the per-department detail fetch
        fetchManufacturingDepartments, // Export the fetchManufacturingDepartments function
        loading, // Export loading state
        error, // Export error state
        listLocationsData, // Export list locations data
        slabwiseData, // Export slabwise data
        actualWipData, // Export Actual WIP report page
        actualWipSummary, // Export Actual WIP department summary
        manufacturingDepartments, // Export manufacturing departments (Location/Department filter source)
    };
}

/**
 * Generates the endpoint URL for a given endpoint and parameters.
 *
 * @param {string} endPoint - The key representing the endpoint in the END_POINTS object.
 * @param {Object} [params={}] - Optional parameters for the endpoint.
 * @returns {string} The generated endpoint URL or an empty string if the endpoint is not mapped.
 */
const generateEndPoint = (endPoint, params = {}) => {
    let endPointName = END_POINTS[endPoint].endpointName?.toString().trim();
    let apiType = END_POINTS[endPoint].apiType?.toString().trim();
    const hasMap = ENV_VAR.NS_API.API[endPointName];

    if (hasMap) {
        let url = `${ENV_VAR.NS_API.BASE_DOMAIN}/app/site/hosting/scriptlet.nl?script=${hasMap.SCRIPT_ID}&deploy=${hasMap.DEPLOY_ID}&apiType=${apiType}${hasMap.APPEND}`;
        return url;
    }
    return "";
};

const wrapInEscapedBody = (data) => {
    return encodeURIComponent(JSON.stringify(data));
};

const unwrapInEscapedBody = (data) => {
    return JSON.parse(decodeURIComponent(data));
};