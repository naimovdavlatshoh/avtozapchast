import { Routes, Route, Navigate, HashRouter } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
// import UserList from "./pages/Users/UserList";
import { Toaster } from "react-hot-toast";
import { SearchProvider } from "./context/SearchContext";

import ClientList from "./pages/Clients/ClientList";
import ProductList from "./pages/Products/ProductList";
import ArrivalList from "./pages/Arrivals/ArrivalList";
import POSPage from "./pages/POS/POSPage";
import CheckPage from "./pages/Check/CheckPage";
import SalesHistoryPage from "./pages/SalesHistory/SalesHistoryPage";
import SaleDetailsPage from "./pages/SalesHistory/SaleDetailsPage";
import DebtorsPage from "./pages/Debtors/DebtorsPage";
import DebtorDetailsPage from "./pages/Debtors/DebtorDetailsPage";

// Role-based Protected Route Component
const RoleBasedRoute = ({
    children,
    allowedRoles,
}: {
    children: React.ReactNode;
    allowedRoles: number[];
}) => {
    const token = localStorage.getItem("token");
    const roleId = parseInt(localStorage.getItem("role_id") || "0");

    if (!token) {
        return <Navigate to="/signin" replace />;
    }

    if (!allowedRoles.includes(roleId)) {
        // Agar role_id = 2 bo'lsa, POS sahifasiga yo'naltirish
        if (roleId === 2) {
            return <Navigate to="/pos" replace />;
        }
        // Agar role_id = 1 bo'lsa, dashboard sahifasiga yo'naltirish
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

// Public Route Component (for auth pages)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem("token");

    if (token) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default function App() {
    return (
        <>
            <SearchProvider>
                <HashRouter>
                    <ScrollToTop />
                    <Routes>
                        {/* Dashboard Layout - Faqat role_id = 1 uchun */}
                        <Route
                            element={
                                <RoleBasedRoute allowedRoles={[1]}>
                                    <AppLayout />
                                </RoleBasedRoute>
                            }
                        >
                            <Route index path="/" element={<ClientList />} />

                            {/* Others Page */}
                            <Route path="/profile" element={<UserProfiles />} />
                            <Route path="/calendar" element={<Calendar />} />
                            <Route path="/blank" element={<Blank />} />

                            {/* Forms */}
                            <Route
                                path="/form-elements"
                                element={<FormElements />}
                            />

                            {/* Tables */}
                            <Route
                                path="/basic-tables"
                                element={<BasicTables />}
                            />

                            <Route path="/products" element={<ProductList />} />
                            <Route path="/arrivals" element={<ArrivalList />} />

                            {/* Ui Elements */}
                            <Route path="/alerts" element={<Alerts />} />
                            <Route path="/avatars" element={<Avatars />} />
                            <Route path="/badge" element={<Badges />} />
                            <Route path="/buttons" element={<Buttons />} />
                            <Route path="/images" element={<Images />} />
                            <Route path="/videos" element={<Videos />} />

                            {/* Charts */}
                            <Route path="/line-chart" element={<LineChart />} />
                            <Route path="/bar-chart" element={<BarChart />} />
                            <Route path="/debtors" element={<DebtorsPage />} />
                            <Route
                                path="/debtors/:debtorId/:debtorName"
                                element={<DebtorDetailsPage />}
                            />
                        </Route>

                        {/* Auth Layout - Public Routes */}
                        <Route
                            path="/signin"
                            element={
                                <PublicRoute>
                                    <SignIn />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/signup"
                            element={
                                <PublicRoute>
                                    <SignUp />
                                </PublicRoute>
                            }
                        />

                        {/* POS Tizimi - Faqat role_id = 2 uchun */}
                        <Route
                            path="/pos"
                            element={
                                <RoleBasedRoute allowedRoles={[2]}>
                                    <POSPage />
                                </RoleBasedRoute>
                            }
                        />

                        {/* Check sahifasi - Faqat role_id = 2 uchun */}
                        <Route
                            path="/check"
                            element={
                                <RoleBasedRoute allowedRoles={[2]}>
                                    <CheckPage />
                                </RoleBasedRoute>
                            }
                        />

                        {/* Sotuv tarixi - Faqat role_id = 2 uchun */}
                        <Route
                            path="/sales-history"
                            element={
                                <RoleBasedRoute allowedRoles={[2]}>
                                    <SalesHistoryPage />
                                </RoleBasedRoute>
                            }
                        />
                        <Route
                            path="/sales-history/:saleId"
                            element={
                                <RoleBasedRoute allowedRoles={[2]}>
                                    <SaleDetailsPage />
                                </RoleBasedRoute>
                            }
                        />

                        {/* Qarzdorlar - Faqat role_id = 1 uchun */}

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                    <Toaster position="bottom-right" reverseOrder={false} />
                </HashRouter>
            </SearchProvider>
        </>
    );
}
