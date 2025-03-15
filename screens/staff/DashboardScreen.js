import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Card, Title, Paragraph, Button, ActivityIndicator } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import adminService from "../../services/adminService";
import bookService from "../../services/bookService";
import DashboardMetricCard from "../../components/staff/DashboardMetricCard";
import RecentActivityList from "../../components/staff/RecentActivityList";

const DashboardScreen = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const { user } = useAuth();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const metricsData = await adminService.getMetrics();
      setMetrics(metricsData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleExportBooks = async () => {
    try {
      await bookService.exportBooks();
      // Handle success - perhaps show a success message
    } catch (error) {
      console.error("Failed to export books:", error);
      // Handle error - show error message
    }
  };

  const handleImportBooks = () => {
    // Navigate to book import screen or open file picker
    navigation.navigate("ImportBooks");
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#4568DC"
        />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons
          name="error-outline"
          size={48}
          color="#f44336"
        />
        <Text style={styles.errorText}>{error}</Text>
        <Button
          mode="contained"
          onPress={loadDashboardData}
          style={styles.retryButton}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Welcome, {user?.name || "Librarian"}</Title>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.metricsContainer}>
        <DashboardMetricCard
          title="Books"
          value={metrics?.bookCount || 0}
          icon="library-books"
          color="#4568DC"
          onPress={() => navigation.navigate("Books")}
        />
        <DashboardMetricCard
          title="Users"
          value={metrics?.userCount || 0}
          icon="people"
          color="#EF5350"
          onPress={() => navigation.navigate("Users")}
        />
        <DashboardMetricCard
          title="Borrowed"
          value={metrics?.borrowedCount || 0}
          icon="book"
          color="#66BB6A"
          onPress={() => navigation.navigate("Circulation", { tab: "checkouts" })}
        />
        <DashboardMetricCard
          title="Overdue"
          value={metrics?.overdueCount || 0}
          icon="access-time"
          color="#FFA726"
          onPress={() => navigation.navigate("Circulation", { tab: "overdue" })}
        />
      </View>

      <Card style={styles.activityCard}>
        <Card.Content>
          <Title>Recent Activity</Title>
          <RecentActivityList activities={metrics?.recentActivities || []} />
        </Card.Content>
      </Card>

      <Card style={styles.statsCard}>
        <Card.Content>
          <Title>Usage Statistics</Title>
          {metrics?.stats ? (
            <>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Most Popular Book</Text>
                  <Text style={styles.statValue}>{metrics.stats.mostPopularBook || "N/A"}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Most Active User</Text>
                  <Text style={styles.statValue}>{metrics.stats.mostActiveUser || "N/A"}</Text>
                </View>
              </View>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Checkouts This Month</Text>
                  <Text style={styles.statValue}>{metrics.stats.checkoutsThisMonth || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Returns This Month</Text>
                  <Text style={styles.statValue}>{metrics.stats.returnsThisMonth || 0}</Text>
                </View>
              </View>
            </>
          ) : (
            <Paragraph>No statistics available</Paragraph>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.actionsCard}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              icon="book-plus"
              onPress={() => navigation.navigate("AddEditBook")}
              style={styles.actionButton}
            >
              Add Book
            </Button>
            <Button
              mode="contained"
              icon="barcode-scan"
              onPress={() => navigation.navigate("BarcodeScanner")}
              style={styles.actionButton}
            >
              Scan
            </Button>
          </View>
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              icon="file-export"
              onPress={handleExportBooks}
              style={styles.actionButton}
            >
              Export Books
            </Button>
            <Button
              mode="outlined"
              icon="file-import"
              onPress={handleImportBooks}
              style={styles.actionButton}
            >
              Import Books
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4568DC",
  },
  header: {
    padding: 16,
    backgroundColor: "white",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  date: {
    color: "#757575",
    marginTop: 4,
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 8,
  },
  activityCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  statsCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  actionsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 24,
    elevation: 2,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  actionButton: {
    minWidth: 120,
    marginHorizontal: 4,
  },
});

export default DashboardScreen;
