Feature: API Secret validating
  As an API provider
  I want to validate a given API Secret against an API Key record
  So that I can know that the given API Secret is correct for that API Key
  
  Scenario: Not given an API Key record
    Given I have an API Secret
      And I do NOT have an API Key record
    When I validate my API Secret against the API Key record
    Then the API Secret should come back as NOT valid
  
  Scenario: Given an API Key record that lacks a hashed API Secret
    Given I have an API Secret
      And I have an API Key record
      And the API Key record does NOT have a hashed API Secret
    When I validate my API Secret against the API Key record
    Then the API Secret should come back as NOT valid
  
  Scenario: Not given an API Secret
    Given I have an API Key record
      And the API Key record has a hash of some unknown API Secret
      But I do NOT have an API Secret
    When I validate my API Secret against the API Key record
    Then the API Secret should come back as NOT valid
  
  Scenario: Given the wrong API Secret for an API Key record
    Given I have an API Secret
      And I have an API Key record
      And the API Key record has a hash of some other API Secret
    When I validate my API Secret against the API Key record
    Then the API Secret should come back as NOT valid
  
  Scenario: Given the correct API Secret for an API Key record
    Given I have an API Secret
      And I have an API Key record
      And the API Key record has a hash of the API Secret
    When I validate my API Secret against the API Key record
    Then the API Secret should come back as valid
