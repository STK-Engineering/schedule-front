import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function PageLayout({
  breadcrumb = [],
  title,
  subtitle,
  scroll = true,
  pageStyle,
  contentStyle,
  children,
}) {
  const navigation = useNavigation();
  const Wrapper = scroll ? ScrollView : View;
  const wrapperProps = scroll
    ? { contentContainerStyle: [styles.content, contentStyle] }
    : {};

  const renderBreadcrumb = () => {
    if (!breadcrumb.length) return null;
    return (
      <View style={styles.breadcrumbRow}>
        {breadcrumb.map((item, idx) => {
          const isLast = idx === breadcrumb.length - 1;
          const canPress = !isLast && item?.route;
          const label = item?.label ?? "";
          const crumb = canPress ? (
            <TouchableOpacity
              key={`${label}-${idx}`}
              onPress={() => navigation.navigate(item.route)}
            >
              <Text style={styles.breadcrumbLink}>{label}</Text>
            </TouchableOpacity>
          ) : (
            <Text
              key={`${label}-${idx}`}
              style={isLast ? styles.breadcrumbCurrent : styles.breadcrumbText}
            >
              {label}
            </Text>
          );

          return (
            <View key={`${label}-${idx}-wrap`} style={styles.breadcrumbItem}>
              {crumb}
              {!isLast ? <Text style={styles.breadcrumbSep}>&gt;</Text> : null}
            </View>
          );
        })}
      </View>
    );
  };

  const content = (
    <>
      {renderBreadcrumb()}
      {title ? <Text style={styles.pageTitle}>{title}</Text> : null}
      {subtitle ? <Text style={styles.pageSubTitle}>{subtitle}</Text> : null}
      {children}
    </>
  );

  if (scroll) {
    return (
      <Wrapper style={[styles.page, pageStyle]} {...wrapperProps}>
        {content}
      </Wrapper>
    );
  }

  return (
    <View style={[styles.page, pageStyle]}>
      <View style={[styles.content, contentStyle]}>{content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  breadcrumbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  breadcrumbItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  breadcrumbLink: {
    fontSize: 12,
    color: "#2563EB",
  },
  breadcrumbText: {
    fontSize: 12,
    color: "#64748B",
  },
  breadcrumbCurrent: {
    fontSize: 12,
    color: "#64748B",
  },
  breadcrumbSep: {
    fontSize: 12,
    color: "#94A3B8",
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  pageSubTitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: -8,
    marginBottom: 12,
  },
});
