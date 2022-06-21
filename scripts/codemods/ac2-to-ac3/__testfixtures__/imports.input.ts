import {
  ApolloProvider,
  ApolloClient,
  compose,
  graphql,
  withApollo,
  ChildProps,
  MutationFunc,
  QueryProps,
  MutationOpts,
  QueryOpts,
  ApolloExecutionResult,
} from "react-apollo";
import gql from "graphql-tag";

graphql(query, { props: () => ({}) });
graphql<ResultType, PropsType, ChildProps>(query, { props: () => ({}) });
graphql<ResultType, PropsType>(query, { props: () => ({}) });
graphql<ResultType>(query, { props: () => ({}) });

graphql<
  CommsPreferencesQueryResponse,
  { mode: CommsPreferenceMode },
  LoadStateSwitcherProps
>(commsPreferencesQuery, {
  options: () => ({ variables: { mode: "accountCommsPreferences" } }),
  props: ({ data }): Partial<LoadStateSwitcherProps> => ({
    loading: !data || data?.loading,
    error: data?.error,
    preferences: data?.commsPreferences?.preferences,
  }),
});
