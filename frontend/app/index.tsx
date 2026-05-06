import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@inventory_items";

type Item = {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: string;
};

const formatRupiah = (value: string) => {
  const num = parseInt(value || "0", 10);
  if (isNaN(num)) return "Rp 0";
  return "Rp " + num.toLocaleString("id-ID");
};

// Cross-platform confirm dialog (web uses window.confirm, native uses Alert.alert)
const confirmDialog = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText: string = "Hapus"
) => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: "Batal", style: "cancel" },
      { text: confirmText, style: "destructive", onPress: onConfirm },
    ]);
  }
};

export default function Index() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load items from AsyncStorage on mount
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (error) {
      console.log("Error loading items:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveItems = async (newItems: Item[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (error) {
      console.log("Error saving items:", error);
      Alert.alert("Error", "Gagal menyimpan data");
    }
  };

  const resetForm = () => {
    setName("");
    setCategory("");
    setPrice("");
    setStock("");
    setEditingItem(null);
    setErrors({});
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    setStock(item.stock);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) {
      newErrors.name = "Nama barang tidak boleh kosong";
    }
    if (!category.trim()) {
      newErrors.category = "Kategori tidak boleh kosong";
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) < 0) {
      newErrors.price = "Harga harus berupa angka valid";
    }
    if (!stock.trim() || isNaN(Number(stock)) || Number(stock) < 0) {
      newErrors.stock = "Stok harus berupa angka valid";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    let newItems: Item[];

    if (editingItem) {
      // Update
      newItems = items.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: name.trim(),
              category: category.trim(),
              price: price.trim(),
              stock: stock.trim(),
            }
          : item
      );
    } else {
      // Create
      const newItem: Item = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        category: category.trim(),
        price: price.trim(),
        stock: stock.trim(),
      };
      newItems = [newItem, ...items];
    }

    setItems(newItems);
    await saveItems(newItems);
    closeModal();
  };

  const handleDelete = (item: Item) => {
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const newItems = items.filter((i) => i.id !== deleteTarget.id);
    setItems(newItems);
    await saveItems(newItems);
    setDeleteTarget(null);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const renderItem = useCallback(
    ({ item }: { item: Item }) => {
      const stockNum = parseInt(item.stock, 10);
      const isLowStock = stockNum <= 5;

      return (
        <View style={styles.card} testID={`item-card-${item.id}`}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} testID={`item-name-${item.id}`}>
                {item.name}
              </Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText} testID={`item-category-${item.id}`}>
                  {item.category}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <Text style={styles.infoLabel}>Harga</Text>
              <Text style={styles.infoValue} testID={`item-price-${item.id}`}>
                {formatRupiah(item.price)}
              </Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.infoLabel}>Stok</Text>
              <Text
                style={[
                  styles.infoValue,
                  isLowStock ? styles.lowStock : styles.normalStock,
                ]}
                testID={`item-stock-${item.id}`}
              >
                {item.stock}
              </Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => openEditModal(item)}
              testID={`edit-btn-${item.id}`}
              activeOpacity={0.7}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => handleDelete(item)}
              testID={`delete-btn-${item.id}`}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteBtnText}>Hapus</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [items]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer} testID="empty-state">
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>Belum Ada Barang</Text>
      <Text style={styles.emptySubtitle}>
        Tekan tombol + di bawah untuk menambahkan barang pertama Anda
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Stats
  const totalItems = items.length;
  const totalStock = items.reduce(
    (sum, item) => sum + (parseInt(item.stock, 10) || 0),
    0
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />

      {/* Header */}
      <View style={styles.header} testID="app-header">
        <Text style={styles.headerTitle}>Manajemen Stok</Text>
        <Text style={styles.headerSubtitle}>Aplikasi Inventory Sederhana</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox} testID="stat-total-items">
            <Text style={styles.statValue}>{totalItems}</Text>
            <Text style={styles.statLabel}>Total Barang</Text>
          </View>
          <View style={styles.statBox} testID="stat-total-stock">
            <Text style={styles.statValue}>{totalStock}</Text>
            <Text style={styles.statLabel}>Total Stok</Text>
          </View>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          items.length === 0 ? styles.emptyListContent : styles.listContent
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        testID="items-list"
      />

      {/* Add FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openAddModal}
        testID="add-item-fab"
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent} testID="form-modal">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? "Edit Barang" : "Tambah Barang"}
              </Text>
              <TouchableOpacity
                onPress={closeModal}
                testID="close-modal-btn"
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formScroll}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Barang *</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    if (errors.name) setErrors({ ...errors, name: "" });
                  }}
                  placeholder="Contoh: Indomie Goreng"
                  placeholderTextColor="#9ca3af"
                  testID="input-name"
                />
                {errors.name ? (
                  <Text style={styles.errorText} testID="error-name">
                    {errors.name}
                  </Text>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Kategori *</Text>
                <TextInput
                  style={[styles.input, errors.category && styles.inputError]}
                  value={category}
                  onChangeText={(t) => {
                    setCategory(t);
                    if (errors.category) setErrors({ ...errors, category: "" });
                  }}
                  placeholder="Contoh: Makanan"
                  placeholderTextColor="#9ca3af"
                  testID="input-category"
                />
                {errors.category ? (
                  <Text style={styles.errorText} testID="error-category">
                    {errors.category}
                  </Text>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Harga (Rp) *</Text>
                <TextInput
                  style={[styles.input, errors.price && styles.inputError]}
                  value={price}
                  onChangeText={(t) => {
                    setPrice(t.replace(/[^0-9]/g, ""));
                    if (errors.price) setErrors({ ...errors, price: "" });
                  }}
                  placeholder="Contoh: 3500"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  testID="input-price"
                />
                {errors.price ? (
                  <Text style={styles.errorText} testID="error-price">
                    {errors.price}
                  </Text>
                ) : price ? (
                  <Text style={styles.helperText}>{formatRupiah(price)}</Text>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Jumlah Stok *</Text>
                <TextInput
                  style={[styles.input, errors.stock && styles.inputError]}
                  value={stock}
                  onChangeText={(t) => {
                    setStock(t.replace(/[^0-9]/g, ""));
                    if (errors.stock) setErrors({ ...errors, stock: "" });
                  }}
                  placeholder="Contoh: 50"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  testID="input-stock"
                />
                {errors.stock ? (
                  <Text style={styles.errorText} testID="error-stock">
                    {errors.stock}
                  </Text>
                ) : null}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={closeModal}
                testID="cancel-btn"
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSave}
                testID="save-btn"
                activeOpacity={0.7}
              >
                <Text style={styles.saveBtnText}>
                  {editingItem ? "Simpan" : "Tambah"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteTarget !== null}
        animationType="fade"
        transparent
        onRequestClose={cancelDelete}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox} testID="delete-confirm-modal">
            <View style={styles.confirmIconWrap}>
              <Text style={styles.confirmIcon}>⚠️</Text>
            </View>
            <Text style={styles.confirmTitle}>Hapus Barang</Text>
            <Text style={styles.confirmMessage}>
              Apakah Anda yakin ingin menghapus{" "}
              <Text style={styles.confirmBold}>
                &quot;{deleteTarget?.name}&quot;
              </Text>
              ?
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmCancelBtn]}
                onPress={cancelDelete}
                testID="confirm-cancel-btn"
                activeOpacity={0.7}
              >
                <Text style={styles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmDeleteBtn]}
                onPress={confirmDelete}
                testID="confirm-delete-btn"
                activeOpacity={0.7}
              >
                <Text style={styles.confirmDeleteText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  header: {
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#bfdbfe",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 12,
    color: "#bfdbfe",
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    color: "#1e40af",
    fontWeight: "500",
  },
  cardRow: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  normalStock: {
    color: "#059669",
  },
  lowStock: {
    color: "#dc2626",
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  editBtn: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  editBtnText: {
    color: "#2563eb",
    fontWeight: "600",
    fontSize: 14,
  },
  deleteBtn: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  deleteBtnText: {
    color: "#dc2626",
    fontWeight: "600",
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 34,
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "600",
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    minHeight: 48,
  },
  inputError: {
    borderColor: "#dc2626",
    backgroundColor: "#fef2f2",
  },
  errorText: {
    fontSize: 13,
    color: "#dc2626",
    marginTop: 6,
    fontWeight: "500",
  },
  helperText: {
    fontSize: 13,
    color: "#2563eb",
    marginTop: 6,
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  cancelBtn: {
    backgroundColor: "#f3f4f6",
  },
  cancelBtnText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "#2563eb",
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  // Delete confirmation modal styles
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  confirmBox: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  confirmIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  confirmIcon: {
    fontSize: 32,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmBold: {
    fontWeight: "600",
    color: "#111827",
  },
  confirmActions: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  confirmCancelBtn: {
    backgroundColor: "#f3f4f6",
  },
  confirmCancelText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
  confirmDeleteBtn: {
    backgroundColor: "#dc2626",
  },
  confirmDeleteText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});
