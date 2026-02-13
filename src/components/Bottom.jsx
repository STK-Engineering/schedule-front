import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Schedule from "../app/Schedule";
import Form from "../app/Form"
import Request from "../app/Request/Request"
import Application from "../app/Application"
import Setting from "../app/Setting";
import Status from "../app/Status/Status"

const Tab = createBottomTabNavigator();

export default function Bottom() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={Schedule} />
      <Tab.Screen name="Write" component={Form} />
      <Tab.Screen name="Application" component={Application} />
      <Tab.Screen name="Request" component={Request} />
      <Tab.Screen name="Status" component={Status} />
      <Tab.Screen name="Setting" component={Setting} />
    </Tab.Navigator>
  );
}
