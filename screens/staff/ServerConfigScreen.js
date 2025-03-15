import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Text, Card, TextInput, Button, Divider, Switch, ActivityIndicator, HelperText, Snackbar, Portal, Dialog, Paragraph, IconButton, Title, List, ProgressBar } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAdmin } from "../../context/AdminContext";
import adminService from "../../services/adminService";
import ErrorDisplay from "../../components/common/ErrorDisplay";

const ServerConfigScreen = () => {
  const navigation = useNavigation();
  const { updateSystemSettings, loading: contextLoading } = useAdmin();

  // State variables
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [resetDialogVisible, setResetDialogVisible] = useState(false);
  const [restartDialogVisible, setRestartDialogVisible] = useState(false);

  // Server configuration state
  const [serverConfig, setServerConfig] = useState({
    // API Configuration
    apiUrl: "",
    apiPort: "",
    apiVersion: "v1",
    apiTimeout: "30000",

    // Database Configuration
    dbHost: "",
    dbPort: "",
    dbName: "",
    dbUser: "",
    dbPassword: "",

    // Email Configuration
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPassword: "",
    smtpFrom: "",
    smtpSecure: false,

    // Security Configuration
    corsOrigin: "*",
    rateLimiterMax: "100",
    rateLimiterWindowMs: "60000",

    // Features
    enableNotifications: true,
    enableRateLimiter: true,
    enableLogging: true,
    debugMode: false,
  });

  // Load server configuration
  useEffect(() => {
    loadServerConfig();
  }, []);

  // Load server configuration from API
  const loadServerConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch server configuration from API
      const config = await adminService.getSystemSettings();

      // Update state with fetched configuration
      setServerConfig({
        ...serverConfig,
        ...config,
      });
    } catch (err) {
      console.error("Failed to load server configuration:", err);
      setError(err.message || "Failed to load server configuration");
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (key, value) => {
    setServerConfig({
      ...serverConfig,
      [key]: value,
    });
  };

  // Save server configuration
  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      setError(null);

      // Call API to update system settings
      const result = await updateSystemSettings(serverConfig);

      if (result.error) {
        throw new Error(result.error);
      }

      // Show success snackbar
      setSnackbarMessage("Server configuration saved successfully");
      setSnackbarVisible(true);
    } catch (err) {
      console.error("Failed to save server configuration:", err);
      Alert.alert("Error", err.message || "Failed to save server configuration");
    } finally {
      setSaving(false);
    }
  };

  // Test server connection
  const handleTestConnection = async () => {
    try {
      setTesting(true);

      // Call API to test connection
      const result = await adminService.testConnection({
        apiUrl: serverConfig.apiUrl,
        apiPort: serverConfig.apiPort,
      });

      if (result.success) {
        setSnackbarMessage("Connection successful! Server is responding.");
      } else {
        setSnackbarMessage("Connection failed. Server not responding.");
      }

      setSnackbarVisible(true);
    } catch (err) {
      setSnackbarMessage("Connection test failed: " + (err.message || "Unknown error"));
      setSnackbarVisible(true);
    } finally {
      setTesting(false);
    }
  };

  // Test email configuration
  const handleTestEmail = async () => {
    try {
      setTesting(true);

      // Call API to test email configuration
      const result = await adminService.testEmail({
        smtpHost: serverConfig.smtpHost,
        smtpPort: serverConfig.smtpPort,
        smtpUser: serverConfig.smtpUser,
        smtpPassword: serverConfig.smtpPassword,
        smtpFrom: serverConfig.smtpFrom,
        smtpSecure: serverConfig.smtpSecure,
      });

      if (result.success) {
        setSnackbarMessage("Email test successful! Test email sent.");
      } else {
        setSnackbarMessage("Email test failed. Please check SMTP settings.");
      }

      setSnackbarVisible(true);
    } catch (err) {
      setSnackbarMessage("Email test failed: " + (err.message || "Unknown error"));
      setSnackbarVisible(true);
    } finally {
      setTesting(false);
    }
  };

  // Handle reset configuration
  const handleResetConfig = () => {
    setResetDialogVisible(true);
  };

  // Confirm reset configuration
  const confirmResetConfig = async () => {
    try {
      setResetDialogVisible(false);
      setSaving(true);

      // Call API to reset configuration
      const result = await adminService.resetSystemSettings();

      if (result.success) {
        // Reload configuration
        await loadServerConfig();

        setSnackbarMessage("Server configuration reset to defaults");
        setSnackbarVisible(true);
      } else {
        throw new Error(result.error || "Failed to reset configuration");
      }
    } catch (err) {
      console.error("Failed to reset configuration:", err);
      Alert.alert("Error", err.message || "Failed to reset configuration");
    } finally {
      setSaving(false);
    }
  };

  // Handle restart server
  const handleRestartServer = () => {
    setRestartDialogVisible(true);
  };

  // Confirm restart server
  const confirmRestartServer = async () => {
    try {
      setRestartDialogVisible(false);
      setSaving(true);

      // Call API to restart server
      const result = await adminService.restartServer();

      if (result.success) {
        setSnackbarMessage("Server restarting, please wait...");
        setSnackbarVisible(true);

        // Wait for server to restart before reloading configuration
        setTimeout(async () => {
          await loadServerConfig();
          setSnackbarMessage("Server restarted successfully");
          setSnackbarVisible(true);
        }, 5000);
      } else {
        throw new Error(result.error || "Failed to restart server");
      }
    } catch (err) {
      console.error("Failed to restart server:", err);
      Alert.alert("Error", err.message || "Failed to restart server");
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#4568DC"
        />
        <Text style={styles.loadingText}>Loading server configuration...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={loadServerConfig}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView style={styles.scrollContainer}>
        {/* Server Status Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title>Server Status</Title>
              <IconButton
                icon="refresh"
                size={20}
                onPress={loadServerConfig}
              />
            </View>

            <View style={styles.statusRow}>
              <MaterialIcons
                name="circle"
                size={16}
                color="#4CAF50"
                style={styles.statusIcon}
              />
              <Text>API Server: Online</Text>
            </View>

            <View style={styles.statusRow}>
              <MaterialIcons
                name="circle"
                size={16}
                color="#4CAF50"
                style={styles.statusIcon}
              />
              <Text>Database: Connected</Text>
            </View>

            <View style={styles.statusRow}>
              <MaterialIcons
                name="circle"
                size={16}
                color={serverConfig.smtpHost ? "#4CAF50" : "#F44336"}
                style={styles.statusIcon}
              />
              <Text>Email Service: {serverConfig.smtpHost ? "Configured" : "Not Configured"}</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Memory Usage:</Text>
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={0.35}
                  color="#4568DC"
                  style={styles.progressBar}
                />
                <Text style={styles.progressText}>35%</Text>
              </View>
            </View>

            <View style={[styles.buttonRow, { marginTop: 15 }]}>
              <Button
                mode="contained"
                onPress={handleTestConnection}
                loading={testing}
                disabled={testing || saving}
                style={[styles.button, { backgroundColor: "#4568DC" }]}
              >
                Test Connection
              </Button>

              <Button
                mode="contained"
                onPress={handleRestartServer}
                loading={saving}
                disabled={testing || saving}
                style={[styles.button, { backgroundColor: "#F44336" }]}
              >
                Restart Server
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* API Configuration */}
        <Card style={styles.card}>
          <Card.Title title="API Configuration" />
          <Card.Content>
            <TextInput
              label="API URL"
              value={serverConfig.apiUrl}
              onChangeText={(text) => handleInputChange("apiUrl", text)}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="API Port"
              value={serverConfig.apiPort}
              onChangeText={(text) => handleInputChange("apiPort", text)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <TextInput
              label="API Version"
              value={serverConfig.apiVersion}
              onChangeText={(text) => handleInputChange("apiVersion", text)}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="API Timeout (ms)"
              value={serverConfig.apiTimeout}
              onChangeText={(text) => handleInputChange("apiTimeout", text)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <View style={styles.switchRow}>
              <Text>Debug Mode</Text>
              <Switch
                value={serverConfig.debugMode}
                onValueChange={(value) => handleInputChange("debugMode", value)}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Database Configuration */}
        <Card style={styles.card}>
          <Card.Title title="Database Configuration" />
          <Card.Content>
            <TextInput
              label="Database Host"
              value={serverConfig.dbHost}
              onChangeText={(text) => handleInputChange("dbHost", text)}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Database Port"
              value={serverConfig.dbPort}
              onChangeText={(text) => handleInputChange("dbPort", text)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <TextInput
              label="Database Name"
              value={serverConfig.dbName}
              onChangeText={(text) => handleInputChange("dbName", text)}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Database Username"
              value={serverConfig.dbUser}
              onChangeText={(text) => handleInputChange("dbUser", text)}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Database Password"
              value={serverConfig.dbPassword}
              onChangeText={(text) => handleInputChange("dbPassword", text)}
              style={styles.input}
              mode="outlined"
              secureTextEntry
            />
          </Card.Content>
        </Card>

        {/* Email Configuration */}
        <Card style={styles.card}>
          <Card.Title title="Email Configuration" />
          <Card.Content>
            <TextInput
              label="SMTP Host"
              value={serverConfig.smtpHost}
              onChangeText={(text) => handleInputChange("smtpHost", text)}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="SMTP Port"
              value={serverConfig.smtpPort}
              onChangeText={(text) => handleInputChange("smtpPort", text)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <TextInput
              label="SMTP Username"
              value={serverConfig.smtpUser}
              onChangeText={(text) => handleInputChange("smtpUser", text)}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="SMTP Password"
              value={serverConfig.smtpPassword}
              onChangeText={(text) => handleInputChange("smtpPassword", text)}
              style={styles.input}
              mode="outlined"
              secureTextEntry
            />

            <TextInput
              label="From Email Address"
              value={serverConfig.smtpFrom}
              onChangeText={(text) => handleInputChange("smtpFrom", text)}
              style={styles.input}
              mode="outlined"
            />

            <View style={styles.switchRow}>
              <Text>Use Secure Connection (SSL)</Text>
              <Switch
                value={serverConfig.smtpSecure}
                onValueChange={(value) => handleInputChange("smtpSecure", value)}
              />
            </View>

            <Button
              mode="contained"
              onPress={handleTestEmail}
              loading={testing}
              disabled={testing || saving || !serverConfig.smtpHost}
              style={[styles.button, { marginTop: 10 }]}
            >
              Test Email Configuration
            </Button>
          </Card.Content>
        </Card>

        {/* Security Configuration */}
        <Card style={styles.card}>
          <Card.Title title="Security Configuration" />
          <Card.Content>
            <TextInput
              label="CORS Origin"
              value={serverConfig.corsOrigin}
              onChangeText={(text) => handleInputChange("corsOrigin", text)}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Rate Limiter Max Requests"
              value={serverConfig.rateLimiterMax}
              onChangeText={(text) => handleInputChange("rateLimiterMax", text)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <TextInput
              label="Rate Limiter Window (ms)"
              value={serverConfig.rateLimiterWindowMs}
              onChangeText={(text) => handleInputChange("rateLimiterWindowMs", text)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <View style={styles.switchRow}>
              <Text>Enable Rate Limiter</Text>
              <Switch
                value={serverConfig.enableRateLimiter}
                onValueChange={(value) => handleInputChange("enableRateLimiter", value)}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Feature Toggles */}
        <Card style={styles.card}>
          <Card.Title title="Feature Toggles" />
          <Card.Content>
            <View style={styles.switchRow}>
              <Text>Enable Notifications</Text>
              <Switch
                value={serverConfig.enableNotifications}
                onValueChange={(value) => handleInputChange("enableNotifications", value)}
              />
            </View>

            <View style={styles.switchRow}>
              <Text>Enable Logging</Text>
              <Switch
                value={serverConfig.enableLogging}
                onValueChange={(value) => handleInputChange("enableLogging", value)}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={handleSaveConfig}
                loading={saving}
                disabled={testing || saving}
                style={[styles.button, { backgroundColor: "#4568DC" }]}
              >
                Save Configuration
              </Button>

              <Button
                mode="outlined"
                onPress={handleResetConfig}
                disabled={testing || saving}
                style={styles.button}
              >
                Reset to Default
              </Button>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Server version: 1.0.0</Text>
          <Text style={styles.footerText}>Last updated: {new Date().toLocaleDateString()}</Text>
        </View>
      </ScrollView>

      {/* Snackbar for messages */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
        action={{
          label: "OK",
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>

      {/* Dialog for reset confirmation */}
      <Portal>
        <Dialog
          visible={resetDialogVisible}
          onDismiss={() => setResetDialogVisible(false)}
        >
          <Dialog.Title>Reset Configuration</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to reset all configuration settings to their default values? This action cannot be undone.</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResetDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={confirmResetConfig}
              color="#F44336"
            >
              Reset
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dialog for restart confirmation */}
      <Portal>
        <Dialog
          visible={restartDialogVisible}
          onDismiss={() => setRestartDialogVisible(false)}
        >
          <Dialog.Title>Restart Server</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to restart the server? All current users will be disconnected and any unsaved data may be lost.</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRestartDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={confirmRestartServer}
              color="#F44336"
            >
              Restart
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    padding: 16,
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
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  input: {
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  divider: {
    marginVertical: 16,
  },
  snackbar: {
    bottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusIcon: {
    marginRight: 8,
  },
  statusLabel: {
    width: 120,
    fontWeight: "bold",
  },
  progressContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    marginLeft: 8,
    width: 35,
    fontSize: 12,
  },
  footer: {
    marginVertical: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#757575",
    fontSize: 12,
    marginBottom: 4,
  },
});

export default ServerConfigScreen;
