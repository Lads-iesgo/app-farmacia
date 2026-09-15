import { ChevronDown, Search } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "./Colors";

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  placeholder: string;
  value: string;
  options: Option[];
  onSelect: (value: string) => void;
  required?: boolean;
}

export default function SelectField({
  label,
  placeholder,
  value,
  options,
  onSelect,
  required,
}: SelectProps) {
  const [visible, setVisible] = useState(false);
  const [busca, setBusca] = useState("");
  const selectedLabel = options.find((opt) => opt.value === value)?.label || "";

  const filteredOptions = busca
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(busca.toLowerCase()),
      )
    : options;

  const handleSelect = (selectedValue: string) => {
    onSelect(selectedValue);
    setVisible(false);
    setBusca("");
  };

  const handleClose = () => {
    setVisible(false);
    setBusca("");
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required ? " *" : ""}
      </Text>

      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {selectedLabel || placeholder}
        </Text>
        <ChevronDown size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{label}</Text>

            <View style={styles.searchBox}>
              <Search size={16} color={Colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Pesquisar..."
                placeholderTextColor={Colors.textSecondary}
                value={busca}
                onChangeText={setBusca}
                autoCapitalize="none"
              />
            </View>

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === value && styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Nenhum item encontrado</Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 6,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  triggerText: { fontSize: 14, color: Colors.text, flex: 1 },
  placeholder: { color: Colors.textSecondary },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    maxHeight: 400,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: Colors.background,
    height: 40,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, height: "100%" },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 12,
  },
  option: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8 },
  optionSelected: { backgroundColor: Colors.primary + "18" },
  optionText: { fontSize: 14, color: Colors.text },
  optionTextSelected: { color: Colors.primary, fontWeight: "600" },
  emptyText: { textAlign: "center", color: Colors.textSecondary, padding: 16 },
});
