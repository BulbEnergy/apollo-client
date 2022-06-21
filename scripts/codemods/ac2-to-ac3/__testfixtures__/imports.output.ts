import { flowRight as compose } from "lodash";
import { graphql, withApollo, ChildProps, QueryControls as QueryProps } from "@apollo/client/react/hoc";

import {
  ApolloProvider,
  ApolloClient,
  MutationFunction as MutationFunc,
  BaseMutationOptions as MutationOpts,
  BaseQueryOptions as QueryOpts,
  FetchResult as ApolloExecutionResult,
  gql,
} from "@apollo/client";

graphql<any, any, any, any>(query, { props: () => ({}) });
graphql<PropsType, ResultType, any, ChildProps>(query, { props: () => ({}) });
graphql<PropsType, ResultType, any, any>(query, { props: () => ({}) });
graphql<any, ResultType, any, any>(query, { props: () => ({}) });

graphql<{ mode: CommsPreferenceMode }, CommsPreferencesQueryResponse, any, LoadStateSwitcherProps>(commsPreferencesQuery, {
  options: () => ({ variables: { mode: "accountCommsPreferences" } }),
  props: ({ data }): Partial<LoadStateSwitcherProps> => ({
    loading: !data || data?.loading,
    error: data?.error,
    preferences: data?.commsPreferences?.preferences,
  }),
});
