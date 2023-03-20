/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.domain.planning;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.optaplanner.core.api.domain.lookup.PlanningId;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public abstract class PlanningBase<TId extends Comparable<TId>> implements Comparable<PlanningBase<TId>> {
    protected TId id;

    @PlanningId
    public TId getId() {
        return this.id;
    }

    public String getShortId() {
        if (this.id != null) {
            String idStr = this.id.toString();
            if (idStr.length() > 8) {
                idStr = idStr.substring(0, 8);
            }
            return idStr;
        }
        return null;
    }

    @Override
    public int compareTo(PlanningBase<TId> other) {
        int classComp = getClass().getName().compareTo(other.getClass().getName());
        if (classComp == 0) {
            return this.id.compareTo(other.getId());
        }
        return classComp;
    }
}
