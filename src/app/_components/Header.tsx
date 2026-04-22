import { Menu } from "lucide-react-native";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "./Colors";
import { useNavbar } from "./NavbarContext";

interface HeaderProps {
  image?: ImageSourcePropType;
  onMenuPress?: () => void;
}

export default function Header({ image, onMenuPress }: HeaderProps) {
  const { open } = useNavbar();

  const handleMenu = onMenuPress || open;

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.menuButton} onPress={handleMenu}>
        <Menu size={28} color={Colors.white} />
      </TouchableOpacity>
      {image ? (
        <Image source={image} style={styles.logoImage} resizeMode="contain" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 16 : 16,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoImage: {
    width: 120,
    height: 40,
  },

  menuButton: {
    padding: 8,
    marginLeft: -8,
  },
});
