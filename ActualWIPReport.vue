<template>
    <div class="min-h-screen w-full px-4 py-2 bg-gray-50">

        <div class="w-full mx-auto">
            <!-- Header -->
            <div class="flex items-center justify-between mb-2">
                <div class="px-2 py-2">
                    <h1 class="text-2xl font-bold text-gray-800">Actual WIP Report</h1>
                    <p class="text-sm text-gray-500 mt-2">Select a report type to view work-in-progress details</p>
                </div>
                <div class="flex items-center gap-2 relative" ref="exportDropdownEl">
                    <button @click="toggleDropdown" class="bg-white border border-gray-300 text-gray-600 hover:text-black hover:border-gray-400 rounded-md px-3 py-2 text-sm shadow-sm">
                        <i class="fas fa-download mr-2"></i>Export
                    </button>
                    <div v-if="showDropdown" class="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-40">
                        <ul class="text-gray-700 text-sm">
                            <li @click="downloadCSV(); toggleDropdown()" class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
                                <i class="fas fa-file-csv mr-2"></i> CSV
                            </li>
                            <li @click="downloadExcel(); toggleDropdown()" class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
                                <i class="fas fa-file-excel mr-2 text-green-600"></i> Excel
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Filters -->
            <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">Location</label>
                        <SearchableSelect v-model="filters.location" :options="locationOptions"
                            :loading="filterOptionsLoading" placeholder="Search location..." />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">Department</label>
                        <SearchableSelect v-model="filters.department" :options="departmentOptions"
                            :loading="filterOptionsLoading" placeholder="Search department..." />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">Date From</label>
                        <input v-model="filters.dateFrom" type="date"
                            class="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">Date To</label>
                        <input v-model="filters.dateTo" type="date"
                            class="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">SO Number</label>
                        <div class="relative">
                            <input v-model="filters.salesOrderNo" type="text" placeholder="SO Number"
                                class="w-full text-sm border border-gray-300 rounded-md pl-2 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                            <button v-if="filters.salesOrderNo" type="button" @click="filters.salesOrderNo = ''" title="Clear"
                                class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 px-1">
                                <i class="fas fa-times text-xs"></i>
                            </button>
                            <button v-else type="button" @click="pasteInto('salesOrderNo')" title="Paste"
                                class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 px-1">
                                <i class="fas fa-paste text-xs"></i>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">WO Number</label>
                        <div class="relative">
                            <input v-model="filters.workOrderNo" type="text" placeholder="WO Number"
                                class="w-full text-sm border border-gray-300 rounded-md pl-2 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                            <button v-if="filters.workOrderNo" type="button" @click="filters.workOrderNo = ''" title="Clear"
                                class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 px-1">
                                <i class="fas fa-times text-xs"></i>
                            </button>
                            <button v-else type="button" @click="pasteInto('workOrderNo')" title="Paste"
                                class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 px-1">
                                <i class="fas fa-paste text-xs"></i>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">Bag Number</label>
                        <div class="relative">
                            <input v-model="filters.bagNumber" type="text" placeholder="Bag Number"
                                class="w-full text-sm border border-gray-300 rounded-md pl-2 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                            <button v-if="filters.bagNumber" type="button" @click="filters.bagNumber = ''" title="Clear"
                                class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 px-1">
                                <i class="fas fa-times text-xs"></i>
                            </button>
                            <button v-else type="button" @click="pasteInto('bagNumber')" title="Paste"
                                class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 px-1">
                                <i class="fas fa-paste text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="flex items-center justify-end gap-2 mt-3">
                    <button @click="applyFilters"
                        class="bg-gray-700 hover:bg-gray-800 text-white text-sm rounded-md px-3 py-1.5">
                        <i class="fas fa-filter mr-1"></i>Apply Filters
                    </button>
                    <button @click="clearFilters"
                        class="bg-white border border-gray-300 text-gray-600 hover:text-black hover:border-gray-400 text-sm rounded-md px-3 py-1.5">
                        Clear
                    </button>
                </div>
            </div>

            <!-- Table -->
            <div>
                <!-- Data Table Section -->
                <div class="mb-6">
                    <h2 class="text-sm font-semibold text-gray-800 mb-3 flex items-center justify-between">
                        <span class="flex items-center">
                            <i class="fas fa-table mr-2 text-table-600"></i>WIP Data
                        </span>
                    </h2>
                    <div class="table-main-wrapper relative isolate rounded-lg border border-gray-200 shadow-sm">
                        <div class="table-main bg-white overflow-auto">
                        <table class="w-full whitespace-nowrap">
                            <thead>
                                <tr class="bg-gray-700 text-white text-[12px] uppercase tracking-wide">
                                    <th class="frozen-col frozen-col-1 px-4 py-2 text-left font-medium bg-gray-700">Location</th>
                                    <th class="frozen-col frozen-col-2 px-4 py-2 text-left font-medium bg-gray-700">Present Department</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Bag Number</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Component Items</th>
                                    <th class="px-4 py-3 text-left font-medium bg-gray-700">Stone Quality Group</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Manufacturer</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">PO Number</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Sales Order No</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Work Order No</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Sales Executive</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Order Date</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">WO Ageing</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">LAST Move Days</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Order Remarks</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">OverDue Days</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Order Type</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Stock Type</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Ordered Quantity</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Bag Generation Date</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">No Of Bags</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Quantity Per Bag</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Customer Name</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Delivery Date</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Design</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Category</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Category Code</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Sub Category</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Production Delays</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Issue Date</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Ring Size</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Metal/Stone Quality</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Metal/Stone Color</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Party Diamond Weight</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Actual Diamond Weight (CT)</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Lot Metal Issue days</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Diamond Pieces new</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Diamond Weight test</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Diamond Weight</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Gross Weight NEW</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Metal Pure Weight</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Net Weight New</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Actual Metal Pure Weight</th>
                                </tr>
                            </thead>
                            <tbody v-if="loading" class="divide-y divide-gray-100">
                                <tr v-for="n in skeletonRowCount" :key="'skeleton-' + n" class="animate-pulse">
                                    <td v-for="c in 40" :key="c" class="px-4 py-3" :class="{ 'frozen-col frozen-col-1 bg-white': c === 1, 'frozen-col frozen-col-2 bg-white': c === 2 }">
                                        <div class="h-3 bg-gray-200 rounded"></div>
                                    </td>
                                </tr>
                            </tbody>
                            <tbody v-else class="divide-y divide-gray-100">
                                <template v-for="(dept, deptIndex) in summaryRows" :key="'dept-' + deptIndex">
                                    <!-- Department summary row -->
                                    <tr class="summary-row bg-gray-100 font-semibold">
                                        <td class="frozen-col frozen-col-1 px-4 py-2 text-gray-900 font-bold summary-cell">{{ dept.location }}</td>
                                        <td class="frozen-col frozen-col-2 px-2 py-2 text-gray-900 summary-cell">
                                            <div class="flex items-center gap-2">
                                                <button type="button"
                                                    @click="toggleDepartment(deptIndex)"
                                                    class="expand-btn flex-shrink-0 w-5 h-5 flex items-center justify-center rounded border border-gray-400 text-gray-600 hover:bg-gray-700 hover:text-white"
                                                    :title="dept.expanded ? 'Collapse' : 'Expand'">
                                                    <i v-if="dept.loading" class="fas fa-spinner fa-spin text-[10px]"></i>
                                                    <i v-else :class="dept.expanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="text-[10px]"></i>
                                                </button>
                                                <span class="font-bold">{{ dept.presentDepartment }}</span>
                                                <span class="text-[10px] font-normal text-gray-500">({{ dept.detailCount }})</span>
                                            </div>
                                        </td>
                                        <!-- Text columns are blank in the summary -->
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2 text-right text-gray-900">{{ dept.orderedQuantity }}</td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2 text-right text-gray-900">{{ dept.noOfBags }}</td>
                                        <td class="px-4 py-2 text-right text-gray-900">{{ dept.quantityPerBag }}</td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2 text-right text-gray-900">{{ dept.partyDiamondWeight }}</td>
                                        <td class="px-4 py-2 text-right text-gray-900">{{ dept.actualDiamondWeightCt }}</td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2 text-right text-gray-900">{{ dept.expectedDiamondPiecesNew }}</td>
                                        <td class="px-4 py-2 text-right text-gray-900">{{ dept.expectedDiamondWeightTest }}</td>
                                        <td class="px-4 py-2 text-right text-gray-900">{{ dept.expectedDiamondWeight }}</td>
                                        <td class="px-4 py-2 text-right text-gray-900">{{ dept.expectedGrossWeightNew }}</td>
                                        <td class="px-4 py-2 text-right text-gray-900">{{ dept.expectedMetalPureWeight }}</td>
                                        <td class="px-4 py-2 text-right text-gray-900">{{ dept.expectedNetWeightNew }}</td>
                                        <td class="px-4 py-2 text-right text-gray-900">{{ dept.actualMetalPureWeight }}</td>
                                    </tr>
                                    <!-- Expanded detail rows for this department -->
                                    <template v-if="dept.expanded">
                                        <tr v-if="dept.error" class="bg-white">
                                            <td :colspan="TOTAL_COLUMNS" class="px-4 py-3 text-center text-red-500 text-xs">
                                                <i class="fas fa-exclamation-triangle mr-1"></i>Failed to load details.
                                                <button @click="toggleDepartment(deptIndex, true)" class="underline ml-1">Retry</button>
                                            </td>
                                        </tr>
                                        <tr v-else-if="!dept.loading && dept.detail.length === 0" class="bg-white">
                                            <td :colspan="TOTAL_COLUMNS" class="px-4 py-3 text-center text-gray-400 text-xs">No detail rows for this department.</td>
                                        </tr>
                                        <tr v-for="(row, index) in dept.detail" :key="'d-' + deptIndex + '-' + index"
                                            class="row-stripe detail-row"
                                            :class="[index % 2 === 1 ? 'bg-gray-50' : 'bg-white', dept.isLastRowOfBagGroup[index] ? 'bag-group-end' : '']">
                                            <td class="frozen-col frozen-col-1 px-4 py-1.5 text-gray-900 font-bold row-stripe-cell">{{ row.location }}</td>
                                            <td class="frozen-col frozen-col-2 px-4 py-1.5 pl-8 text-gray-900 row-stripe-cell">{{ row.presentDepartment }}</td>
                                            <td v-if="dept.bagNumberRowSpans[index] > 0" :rowspan="dept.bagNumberRowSpans[index]"
                                                class="bag-number-cell px-4 py-1.5 text-gray-900 font-bold align-middle"
                                                :class="index % 2 === 1 ? 'bg-gray-50' : 'bg-white'">{{ row.bagNumber }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.componentItems }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.stoneQualityGroup }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.manufacturer }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.poNumber }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.salesOrderNo }}</td>
                                            <td class="px-4 py-1.5 font-medium text-gray-900">{{ row.workorder }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.salesExecutive }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.orderDate }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.woAgeing }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.lastMoveDays }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.orderRemarks }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.overDueDays }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.orderType }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.stockType }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.orderedQuantity }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.bagGenerationDate }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.noOfBags }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.quantityPerBag }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.customerName }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.deliveryDate }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.design }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.category }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.categoryCode }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.subCategory }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.productionDelays }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.issueDate }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.ringSize }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.metalStoneQuality }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.metalStoneColor }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.partyDiamondWeight }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.actualDiamondWeightCt }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.lotMetalIssueDays }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.expectedDiamondPiecesNew }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.expectedDiamondWeightTest }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.expectedDiamondWeight }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.expectedGrossWeightNew }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.expectedMetalPureWeight }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.expectedNetWeightNew }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.actualMetalPureWeight }}</td>
                                        </tr>
                                    </template>
                                </template>
                            </tbody>
                        </table>
                        </div>
                        <div v-if="!loading && summaryRows.length === 0"
                            class="no-records-overlay absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center text-gray-500 pointer-events-none">
                            <div class="text-center">
                                <i class="fas fa-search text-gray-400 text-lg block mb-2"></i>
                                No records found.
                            </div>
                        </div>
                        <div v-if="loading"
                            class="loading-ring-overlay absolute top-0 left-0 right-0 bottom-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                            <div class="loading-ring"></div>
                            <span class="text-sm font-medium text-gray-600">Loading records&hellip;</span>
                        </div>
                    </div>

                    <!-- Summary footer -->
                    <div class="flex items-center justify-end mt-4">
                        <span class="text-xs font-normal text-gray-500 flex items-center gap-1.5">
                            <span v-if="loading" class="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></span>
                            <template v-if="!loading">{{ summaryRows.length }} departments</template>
                            <template v-else>Loading summary&hellip;</template>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useToast } from "vue-toast-notification";
import ExcelJS from 'exceljs';
import { useAllReportsApi } from '../services/NetSuite_API';
import SearchableSelect from '../components/SearchableSelect.vue';

export default {
    name: 'ActualWIPReport',
    components: { SearchableSelect },
    setup() {
        const $toast = useToast();
        const {
            fetchActualWipSummary,
            actualWipSummary,
            fetchActualWipDepartmentDetail,
            fetchManufacturingDepartments,
            manufacturingDepartments,
        } = useAllReportsApi();
        const loading = ref(true);
        const filterOptionsLoading = ref(true);

        const skeletonRowCount = 12;
        const showDropdown = ref(false);

        // Number of <td> columns per row -- used by full-width message rows
        // (colspan) inside an expanded department (error / no-detail states).
        const TOTAL_COLUMNS = 42;

        // One entry per department: the summary aggregate plus this row's own
        // expansion state. Detail rows are fetched lazily (one API call per
        // department) the first time it's expanded and cached thereafter, so
        // the whole dataset is never pulled into the page at once.
        const summaryRows = ref([]);

        const filters = ref({
            location: '',
            department: '',
            dateFrom: '',
            dateTo: '',
            salesOrderNo: '',
            workOrderNo: '',
            bagNumber: '',
        });
        const appliedFilters = ref({});

        const exportDropdownEl = ref(null);

        const toggleDropdown = () => {
            showDropdown.value = !showDropdown.value;
        };

        const onExportDropdownClickOutside = (event) => {
            if (showDropdown.value && exportDropdownEl.value && !exportDropdownEl.value.contains(event.target)) {
                showDropdown.value = false;
            }
        };

        onMounted(() => document.addEventListener('click', onExportDropdownClickOutside));
        onBeforeUnmount(() => document.removeEventListener('click', onExportDropdownClickOutside));

        // Consecutive rows sharing the same Bag Number belong to one bag's
        // component breakdown -- merge them into a single spanning cell
        // instead of repeating the bag number on every line. Computed per
        // department's own detail array (only adjacent rows, which the backend
        // already orders by bag generation ID).
        const computeBagNumberRowSpans = (rows) => {
            const spans = new Array(rows.length).fill(0);
            let groupStart = 0;
            for (let i = 1; i <= rows.length; i++) {
                if (i === rows.length || rows[i].bagNumber !== rows[groupStart].bagNumber) {
                    spans[groupStart] = i - groupStart;
                    groupStart = i;
                }
            }
            return spans;
        };

        // Marks the last row of each bag-number group so a divider border can
        // be drawn under it, visually separating one bag's rows from the next.
        const computeIsLastRowOfBagGroup = (rows) => {
            return rows.map((row, i) => i === rows.length - 1 || rows[i + 1].bagNumber !== row.bagNumber);
        };

        // Load the department-level summary (one row per department). This is
        // the initial view and what a filter apply/clear reloads.
        const loadSummary = async () => {
            loading.value = true;
            try {
                await fetchActualWipSummary({ filters: appliedFilters.value });
                const rows = (actualWipSummary.value && actualWipSummary.value.data) || [];
                summaryRows.value = rows.map((row) => ({
                    ...row,
                    expanded: false,
                    loading: false,
                    error: false,
                    detail: [],
                    bagNumberRowSpans: [],
                    isLastRowOfBagGroup: [],
                }));
            } catch (error) {
                summaryRows.value = [];
                $toast.error("Error fetching summary", { position: "top" });
            } finally {
                loading.value = false;
            }
        };

        // Expand/collapse a single department. On first expand (or a retry)
        // the department's detail rows are fetched via their own API call and
        // cached on the row; subsequent expands just toggle visibility.
        const toggleDepartment = async (deptIndex, forceReload = false) => {
            const dept = summaryRows.value[deptIndex];
            if (!dept) { return; }

            // Collapse if already open (unless we're forcing a reload/retry).
            if (dept.expanded && !forceReload) {
                dept.expanded = false;
                return;
            }

            dept.expanded = true;

            // Already have cached detail and not retrying -> nothing to fetch.
            if (dept.detail.length > 0 && !forceReload) { return; }

            dept.loading = true;
            dept.error = false;
            try {
                const detail = await fetchActualWipDepartmentDetail({
                    department: dept.presentDepartment,
                    filters: appliedFilters.value,
                });
                dept.detail = detail || [];
                dept.bagNumberRowSpans = computeBagNumberRowSpans(dept.detail);
                dept.isLastRowOfBagGroup = computeIsLastRowOfBagGroup(dept.detail);
            } catch (error) {
                dept.error = true;
                dept.detail = [];
                $toast.error("Error loading department details", { position: "top" });
            } finally {
                dept.loading = false;
            }
        };

        const applyFilters = async () => {
            const hasAnyFilter = Object.values(filters.value).some((value) => !!value);
            if (!hasAnyFilter) {
                $toast.info("Please add at least one filter before applying", { position: "top" });
                return;
            }
            appliedFilters.value = { ...filters.value };
            await loadSummary();
        };

        const clearFilters = async () => {
            filters.value = {
                location: '',
                department: '',
                dateFrom: '',
                dateTo: '',
                salesOrderNo: '',
                workOrderNo: '',
                bagNumber: '',
            };
            appliedFilters.value = {};
            await loadSummary();
        };

        const pasteInto = async (field) => {
            try {
                const text = await navigator.clipboard.readText();
                if (text) { filters.value[field] = text.trim(); }
            } catch (err) {
                console.error('Clipboard paste failed:', err);
            }
        };

        // Distinct, alphabetically sorted location names across every
        // manufacturing department row (a location can host multiple
        // departments, so this de-dupes rather than listing one per row).
        const locationOptions = computed(() => {
            const names = manufacturingDepartments.value
                .map((row) => row.locationName)
                .filter((name) => !!name);
            return Array.from(new Set(names)).sort();
        });

        // Department options narrow to whichever location is currently typed
        // into the Location filter -- picking a location first limits the
        // Department dropdown to only the departments under that location.
        // Departments with no location (locationName null) always show, since
        // there's nothing to filter them against.
        const departmentOptions = computed(() => {
            const selectedLocation = filters.value.location;
            const rows = selectedLocation
                ? manufacturingDepartments.value.filter((row) => !row.locationName || row.locationName === selectedLocation)
                : manufacturingDepartments.value;
            const names = rows.map((row) => row.departmentName).filter((name) => !!name);
            return Array.from(new Set(names)).sort();
        });

        // If the user had already picked a department and then changes (or
        // clears) the location to one that department isn't under, drop the
        // now-invalid department selection instead of silently filtering on
        // a value no longer offered in its own dropdown.
        watch(() => filters.value.location, () => {
            if (filters.value.department && !departmentOptions.value.includes(filters.value.department)) {
                filters.value.department = '';
            }
        });

        const loadFilterOptions = async () => {
            filterOptionsLoading.value = true;
            try {
                await fetchManufacturingDepartments();
            } finally {
                filterOptionsLoading.value = false;
            }
        };

        onMounted(async () => {
            await Promise.all([loadSummary(), loadFilterOptions()]);
        });

        const getTimestamp = () => {
            const now = new Date();
            return now.getFullYear() + "-" +
                String(now.getMonth() + 1).padStart(2, '0') + "-" +
                String(now.getDate()).padStart(2, '0') + "_" +
                String(now.getHours()).padStart(2, '0') + "-" +
                String(now.getMinutes()).padStart(2, '0') + "-" +
                String(now.getSeconds()).padStart(2, '0');
        };

        const exportColumns = [
            ["Location", "location"],
            ["Present Department", "presentDepartment"],
            ["Bag Number", "bagNumber"],
            ["Component Items", "componentItems"],
            ["Stone Quality Group", "stoneQualityGroup"],
            ["Manufacturer", "manufacturer"],
            ["PO Number", "poNumber"],
            ["Sales Order No", "salesOrderNo"],
            ["Work Order No", "workorder"],
            ["Sales Executive", "salesExecutive"],
            ["Order Date", "orderDate"],
            ["WO Ageing", "woAgeing"],
            ["LAST Move Days", "lastMoveDays"],
            ["Order Remarks", "orderRemarks"],
            ["OverDue Days", "overDueDays"],
            ["Order Type", "orderType"],
            ["Stock Type", "stockType"],
            ["Ordered Quantity", "orderedQuantity"],
            ["Bag Generation Date", "bagGenerationDate"],
            ["No Of Bags", "noOfBags"],
            ["Quantity Per Bag", "quantityPerBag"],
            ["Customer Name", "customerName"],
            ["Delivery Date", "deliveryDate"],
            ["Design", "design"],
            ["Category", "category"],
            ["Category Code", "categoryCode"],
            ["Sub Category", "subCategory"],
            ["Production Delays", "productionDelays"],
            ["Issue Date", "issueDate"],
            ["Ring Size", "ringSize"],
            ["Metal/Stone Quality", "metalStoneQuality"],
            ["Metal/Stone Color", "metalStoneColor"],
            ["Party Diamond Weight", "partyDiamondWeight"],
            ["Actual Diamond Weight (CT)", "actualDiamondWeightCt"],
            ["Lot Metal Issue days", "lotMetalIssueDays"],
            ["Expected Diamond Pieces new", "expectedDiamondPiecesNew"],
            ["Expected Diamond Weight test", "expectedDiamondWeightTest"],
            ["Expected Diamond Weight", "expectedDiamondWeight"],
            ["Expected Gross Weight NEW", "expectedGrossWeightNew"],
            ["Expected Metal Pure Weight", "expectedMetalPureWeight"],
            ["Expected Net Weight New", "expectedNetWeightNew"],
            ["Actual Metal Pure Weight", "actualMetalPureWeight"],
        ];

        // Overrides the default label-length column width for fields whose
        // content tends to run much longer or shorter than their header --
        // free-text fields (remarks, names, items) need extra room; single
        // short values (sizes, day counts) don't need the header's full width.
        const exportColumnWidthOverrides = {
            componentItems: 30,
            orderRemarks: 30,
            customerName: 45,
            design: 20,
            metalStoneQuality: 22,
            metalStoneColor: 20,
            salesExecutive: 30,
            manufacturer: 30,
            ringSize: 10,
            woAgeing: 10,
            lastMoveDays: 12,
            overDueDays: 12,
            lotMetalIssueDays: 14,
            stockType: 16,
            category: 25,
            subCategory: 25,
            issueDate: 25,
        };

        // The export mirrors what's on screen: each department summary row,
        // followed (if that department is currently expanded) by its detail
        // rows. Summary rows carry only the SUMmed quantity/weight columns;
        // the rest are blank, matching the table.
        const buildExportRows = () => {
            const out = [];
            summaryRows.value.forEach((dept) => {
                out.push({ ...dept, presentDepartment: dept.presentDepartment });
                if (dept.expanded && dept.detail.length) {
                    dept.detail.forEach((row) => out.push(row));
                }
            });
            return out;
        };

        const downloadCSV = () => {
            const rows = [exportColumns.map(([label]) => label)];

            buildExportRows().forEach(row => {
                rows.push(exportColumns.map(([, key]) => row[key]));
            });

            const csvContent = rows.map(row => row.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            if (link.download !== undefined) {
                const timestamp = getTimestamp();
                const filename = `actual_wip_report_${timestamp}.csv`;

                link.setAttribute("href", URL.createObjectURL(blob));
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        };

        // Mirrors the on-screen table: dark header row (Tailwind bg-gray-700),
        // white header text, alternating white/bg-gray-50 row stripes, thin
        // borders, and the Location/Present Department columns frozen -- so
        // the exported file reads as the same view, not a bare data dump.
        const downloadExcel = async () => {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Actual WIP Report', {
                views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }],
            });

            sheet.columns = exportColumns.map(([label, key]) => ({
                header: label,
                width: exportColumnWidthOverrides[key] || Math.max(label.length + 2, 12),
            }));

            buildExportRows().forEach((row) => {
                sheet.addRow(exportColumns.map(([, key]) => row[key]));
            });

            const headerRow = sheet.getRow(1);
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
            });
            headerRow.height = 20;

            const thinBorder = { style: 'thin', color: { argb: 'FFE5E7EB' } };
            sheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) { return; }
                row.height = 20;
                const isStriped = rowNumber % 2 === 0;
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: isStriped ? 'FFF9FAFB' : 'FFFFFFFF' },
                    };
                    cell.border = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
                });
            });

            const timestamp = getTimestamp();
            const filename = `actual_wip_report_${timestamp}.xlsx`;

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        };

        return {
            loading,
            skeletonRowCount,
            TOTAL_COLUMNS,
            summaryRows,
            toggleDepartment,
            downloadCSV,
            downloadExcel,
            showDropdown,
            exportDropdownEl,
            toggleDropdown,
            filters,
            applyFilters,
            clearFilters,
            pasteInto,
            locationOptions,
            departmentOptions,
            filterOptionsLoading,
        };
    }
};
</script>
<style scoped>
body{
    padding: 0;
    margin: 0;
}
.badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 9999px;
    display: inline-block;
}

.badge-progress {
    background-color: #FEF3C7;
    color: #92400E;
}

.badge-done {
    background-color: #D1FAE5;
    color: #065F46;
}

.badge-pending {
    background-color: #E5E7EB;
    color: #374151;
}

.table-main-wrapper {
    height: 700px;
    overflow: hidden;
}

.table-main {
    height: 100%;
    overflow: auto;
    font-size: 11px;
}

.no-records-overlay {
    z-index: 9999;
    font-size: 16px;
    background-color: #ffffff00;
}

.loading-ring-overlay {
    z-index: 9999;
    background-color: rgba(255, 255, 255, 0.4);
}

.loading-ring {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top-color: #374151;
    border-radius: 50%;
    animation: loading-ring-spin 0.8s linear infinite;
}

@keyframes loading-ring-spin {
    to {
        transform: rotate(360deg);
    }
}

.table-main thead th {
    position: sticky;
    top: 0;
    z-index: 20;
}

.table-main .frozen-col {
    position: sticky;
    z-index: 10;
}

.table-main .frozen-col-1 {
    left: 0;
    width: 140px;
    min-width: 140px;
    max-width: 140px;
}

.table-main .frozen-col-2 {
    left: 140px;
    position: sticky;
}

.table-main .frozen-col-2::after {
    content: '';
    position: absolute;
    top: 0;
    right: -2px;
    bottom: 0;
    width: 2px;
    background-color: #374151;
    z-index: 40;
    pointer-events: none;
}

.table-main thead th.frozen-col {
    z-index: 30;
}

.table-main tbody td.frozen-col {
    z-index: 15;
}

.row-stripe:hover {
    background-image: linear-gradient(to bottom, #ffffff, #cbcbcb);
    border-left: 4px solid #374151;
}

.row-stripe:hover td.bag-number-cell {
    background-image: none;
}

.row-stripe-cell {
    background-color: inherit;
}

.row-stripe td {
    transition: box-shadow 0.15s ease, background-color 0.15s ease;
}

.bag-group-end td {
    border-bottom: 2px solid #374151;
}

.bag-group-end td.frozen-col {
    border-bottom: none;
}

.bag-number-cell {
    border-bottom: 2px solid #374151;
}

tr {
    transition: background-color 0.15s ease;
}

/* Department summary rows: visually distinct header-like band, with the two
   frozen columns matching the row's background so they don't show through. */
.summary-row td {
    border-top: 1px solid #d1d5db;
    border-bottom: 1px solid #d1d5db;
}

.summary-cell {
    background-color: #f3f4f6;
}

.summary-row:hover td {
    background-color: #e5e7eb;
}

.summary-row:hover .summary-cell {
    background-color: #e5e7eb;
}

.expand-btn {
    transition: background-color 0.15s ease, color 0.15s ease;
}
</style>
