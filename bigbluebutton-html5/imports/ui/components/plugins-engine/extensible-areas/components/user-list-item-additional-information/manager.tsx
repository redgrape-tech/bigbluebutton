import { useEffect, useState, useContext } from 'react';
import * as PluginSdk from 'bigbluebutton-html-plugin-sdk';

import {
  ExtensibleAreaComponentManagerProps, ExtensibleArea,
  ExtensibleAreaComponentManager,
} from '../../types';
import { PluginsContext } from '../../../../components-data/plugin-context/context';

const UserListItemAdditionalInformationPluginStateContainer = ((
  props: ExtensibleAreaComponentManagerProps,
) => {
  const {
    uuid,
    generateItemWithId,
    extensibleAreaMap,
    pluginApi,
  } = props;
  const [
    userListItemAdditionalInformation,
    setUserListItemAdditionalInformation,
  ] = useState<PluginSdk.UserListItemAdditionalInformationInterface[]>([]);

  const {
    pluginsExtensibleAreasAggregatedState,
    setPluginsExtensibleAreasAggregatedState,
  } = useContext(PluginsContext);

  useEffect(() => {
    // Change this plugin provided toolbar items
    extensibleAreaMap[uuid].userListItemAdditionalInformation = userListItemAdditionalInformation;

    // Update context with computed aggregated list of all plugin provided toolbar items
    const aggregatedUserListItemAdditionalInformation = (
      [] as PluginSdk.UserListItemAdditionalInformationInterface[]).concat(
      ...Object.values(extensibleAreaMap)
        .map((extensibleArea: ExtensibleArea) => extensibleArea.userListItemAdditionalInformation),
    );
    setPluginsExtensibleAreasAggregatedState(
      {
        ...pluginsExtensibleAreasAggregatedState,
        userListItemAdditionalInformation: aggregatedUserListItemAdditionalInformation,
      },
    );
  }, [userListItemAdditionalInformation]);

  pluginApi.setUserListItemAdditionalInformation = (items: PluginSdk.UserListItemAdditionalInformationInterface[]) => {
    const itemsWithId = items.map(generateItemWithId) as PluginSdk.UserListItemAdditionalInformationInterface[];
    return setUserListItemAdditionalInformation(itemsWithId);
  };
  return null;
}) as ExtensibleAreaComponentManager;

export default UserListItemAdditionalInformationPluginStateContainer;
